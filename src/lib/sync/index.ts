import { createD1, schema } from "@/db";
import type { Env } from "@/types";
import { fetchCatalog, type SyncCatalog } from "./catalog";
import { calibrateFares, DEFAULT_BRACKETS, type FareBracket } from "./fares";
import { fetchDmrc } from "../dmrc";
import type { DmrcFareRoute } from "../dmrcTypes";
import { haversineKm, parseDmrcTime } from "../geo";
import { eq } from "drizzle-orm";

export const SYNC_LOCK_KEY = "sync:lock";
export const SYNC_LOCK_TTL = 25 * 60; // seconds
const ROUTE_SAMPLE_MAX = 20;

export interface SyncResult {
  startedAt: number;
  finishedAt: number;
  lines: number;
  stations: number;
  edges: number;
  fareBrackets: number;
  status: "success" | "partial" | "empty";
}

/**
 * Run a full sync: fetch catalog, derive edge weights, calibrate fares,
 * write D1, publish the in-memory graph to the Durable Object, warm KV.
 */
export async function runSync(env: Env): Promise<SyncResult> {
  const startedAt = Date.now();
  const db = createD1(env.DB);

  // 1. Acquire lock (KV) with stale-lock handling
  const existing = await env.CACHE.get(SYNC_LOCK_KEY);
  if (existing === "1") {
    const runningRow = await db
      .select()
      .from(schema.syncMeta)
      .where(eq(schema.syncMeta.key, "syncRunning"))
      .get();
    const runningSince = Number(runningRow?.value ?? 0);
    if (runningSince > 0 && Date.now() - runningSince < 30 * 60 * 1000) {
      throw new Error("Sync already running");
    }
  }
  await env.CACHE.put(SYNC_LOCK_KEY, "1", { expirationTtl: SYNC_LOCK_TTL });
  await db
    .insert(schema.syncMeta)
    .values({ key: "syncRunning", value: String(startedAt), updatedAt: startedAt })
    .onConflictDoUpdate({
      target: schema.syncMeta.key,
      set: { value: String(startedAt), updatedAt: startedAt },
    });

  try {
    // 2. Fetch catalog
    const catalog = await fetchCatalog();
    if (catalog.lines.length === 0 || catalog.stations.length === 0) {
      return { startedAt, finishedAt: Date.now(), lines: 0, stations: 0, edges: 0, fareBrackets: 0, status: "empty" };
    }

    // 3. Derive real edge weights from route samples
    const samplePairs = buildSamplePairs(catalog);
    const { fareSamples } = await assignEdgeWeights(catalog, samplePairs);

    // 4. Calibrate fares; fall back to previous or defaults
    let brackets: FareBracket[] | null = await calibrateFares(fareSamples);
    if (!brackets) {
      const prev = await db.select().from(schema.fareBrackets).all();
      brackets = prev.length
        ? prev.map((p) => ({ maxDistanceKm: p.maxDistanceKm, fare: p.fare }))
        : DEFAULT_BRACKETS;
    }

    // 5. Write D1 (clear + insert for idempotency)
    await clearTables(env);
    await insertCatalog(env, catalog, brackets);

    // 6. Publish in-memory graph to the Durable Object
    await publishGraph(env, catalog, brackets);

    // 7. Record sync state + warm KV
    const finishedAt = Date.now();
    await db
      .insert(schema.syncMeta)
      .values({ key: "lastSync", value: String(finishedAt), updatedAt: finishedAt })
      .onConflictDoUpdate({
        target: schema.syncMeta.key,
        set: { value: String(finishedAt), updatedAt: finishedAt },
      });
    await db.delete(schema.syncMeta).where(eq(schema.syncMeta.key, "syncRunning"));

    await env.CACHE.put(
      "cache:stations",
      JSON.stringify(catalog.stations.map((s) => ({ code: s.stationCode, name: s.name }))),
      { expirationTtl: 3600 }
    );
    await env.CACHE.put(
      "cache:lines",
      JSON.stringify(catalog.lines.map((l) => ({ code: l.lineCode, name: l.lineColor, color: l.primaryColorCode ?? l.lineColor }))),
      { expirationTtl: 3600 }
    );
    await env.CACHE.put(
      "cache:lastSync",
      JSON.stringify({ lastSync: finishedAt, stations: catalog.stations.length, edges: catalog.edges.length }),
      { expirationTtl: 4 * 3600 }
    );

    return {
      startedAt,
      finishedAt,
      lines: catalog.lines.length,
      stations: catalog.stations.length,
      edges: catalog.edges.length,
      fareBrackets: brackets.length,
      status: "success",
    };
  } catch (err) {
    console.error("sync failed", err);
    throw err;
  } finally {
    await env.CACHE.delete(SYNC_LOCK_KEY).catch(() => {});
    await db
      .delete(schema.syncMeta)
      .where(eq(schema.syncMeta.key, "syncRunning"))
      .catch(() => {});
  }
}

async function clearTables(env: Env): Promise<void> {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM station_day_timings"),
    env.DB.prepare("DELETE FROM station_facilities"),
    env.DB.prepare("DELETE FROM station_platforms"),
    env.DB.prepare("DELETE FROM station_lines"),
    env.DB.prepare("DELETE FROM station_timings"),
    env.DB.prepare("DELETE FROM edges"),
    env.DB.prepare("DELETE FROM stations"),
    env.DB.prepare("DELETE FROM lines"),
    env.DB.prepare("DELETE FROM fare_brackets"),
  ]);
}

async function insertCatalog(
  env: Env,
  catalog: SyncCatalog,
  brackets: FareBracket[]
): Promise<void> {
  const db = createD1(env.DB);
  // D1 SQLite has a 100-variable limit per statement. Each row uses its column
  // count of variables, so keep batches well under that.
  const stationChunk = 8; // 10 cols
  const edgeChunk = 15; // 6 cols
  const pairChunk = 25; // 4 cols
  const timingChunk = 30; // 3 cols

  for (const line of catalog.lines) {
    await db
      .insert(schema.lines)
      .values({
        lineCode: line.lineCode,
        name: line.name,
        lineColor: line.lineColor,
        primaryColorCode: line.primaryColorCode,
        secondaryColorCode: line.secondaryColorCode,
        startStation: line.startStation,
        endStation: line.endStation,
        showInFrontend: line.showInFrontend,
        status: line.status,
        orderIndex: line.orderIndex,
      })
      .onConflictDoNothing();
  }

  for (let i = 0; i < catalog.stations.length; i += stationChunk) {
    const slice = catalog.stations.slice(i, i + stationChunk);
    await db
      .insert(schema.stations)
      .values(
        slice.map((s) => ({
          stationCode: s.stationCode,
          name: s.name,
          commercialName: s.commercialName,
          latitude: s.latitude,
          longitude: s.longitude,
          xCoords: s.xCoords,
          yCoords: s.yCoords,
          stationType: s.stationType,
          interchange: s.interchange,
          status: s.status,
          openingTime: s.openingTime,
          closingTime: s.closingTime,
        }))
      )
      .onConflictDoNothing();
  }

  const stationLineValues = catalog.stations.flatMap((s) =>
    s.lines.map((l) => ({
      stationCode: s.stationCode,
      lineCode: l.lineCode,
      orderIndex: l.orderIndex,
    }))
  );
  for (let i = 0; i < stationLineValues.length; i += pairChunk) {
    await db
      .insert(schema.stationLines)
      .values(stationLineValues.slice(i, i + pairChunk))
      .onConflictDoNothing();
  }

  const timingsValues = catalog.stations
    .filter((s) => s.firstTrain || s.lastTrain)
    .map((s) => ({
      stationCode: s.stationCode,
      firstTrain: s.firstTrain,
      lastTrain: s.lastTrain,
    }));
  for (let i = 0; i < timingsValues.length; i += timingChunk) {
    await db
      .insert(schema.stationTimings)
      .values(timingsValues.slice(i, i + timingChunk))
      .onConflictDoNothing();
  }

  // Per-day directional timings (7 cols; keep batches under the 100-var cap).
  const dayTimingValues = catalog.stations.flatMap((s) =>
    s.dayTimings.map((t) => ({
      stationCode: s.stationCode,
      dayGroup: t.dayGroup,
      towardsCode: t.towardsCode,
      towardsName: t.towardsName,
      firstTrainTime: t.firstTrainTime,
      lastTrainTime: t.lastTrainTime,
    }))
  );
  const dayTimingChunk = 14;
  for (let i = 0; i < dayTimingValues.length; i += dayTimingChunk) {
    await db
      .insert(schema.stationDayTimings)
      .values(dayTimingValues.slice(i, i + dayTimingChunk))
      .onConflictDoNothing();
  }

  const platformChunk = 24; // 4 cols (4 * 24 = 96 <= 100 var limit)
  for (let i = 0; i < catalog.platforms.length; i += platformChunk) {
    await db
      .insert(schema.stationPlatforms)
      .values(
        catalog.platforms.slice(i, i + platformChunk).map((p) => ({
          stationCode: p.stationCode,
          lineCode: p.lineCode,
          direction: p.direction,
          platformNo: p.platformNo,
        }))
      )
      .onConflictDoNothing();
  }

  // Station facilities (one row per station; 8 cols each).
  const facilityChunk = 12;
  for (let i = 0; i < catalog.stations.length; i += facilityChunk) {
    const slice = catalog.stations.slice(i, i + facilityChunk);
    await db
      .insert(schema.stationFacilities)
      .values(
        slice.map((s) => ({
          stationCode: s.stationCode,
          description: s.facilities.description,
          mobile: s.facilities.mobile,
          landline: s.facilities.landline,
          amenities: JSON.stringify(s.facilities.amenities),
          gates: JSON.stringify(s.facilities.gates),
          lifts: JSON.stringify(s.facilities.lifts),
          parking: JSON.stringify(s.facilities.parking),
        }))
      )
      .onConflictDoNothing();
  }

  for (let i = 0; i < catalog.edges.length; i += edgeChunk) {
    const slice = catalog.edges.slice(i, i + edgeChunk);
    await db
      .insert(schema.edges)
      .values(
        slice.map((e) => ({
          fromCode: e.fromCode,
          toCode: e.toCode,
          lineCode: e.lineCode,
          timeMin: e.timeMin,
          distanceKm: e.distanceKm,
          direction: e.direction,
        }))
      )
      .onConflictDoNothing();
  }

  for (const b of brackets) {
    await db
      .insert(schema.fareBrackets)
      .values({
        maxDistanceKm: b.maxDistanceKm === Infinity ? 9999 : b.maxDistanceKm,
        fare: b.fare,
      })
      .onConflictDoNothing();
  }
}

/**
 * Derive real per-hop times (from route path_time split over hops) and
 * per-hop distances (haversine) for catalog edges. Also produces fare
 * calibration samples (from -> to -> straight-line km).
 */
async function assignEdgeWeights(
  catalog: SyncCatalog,
  samplePairs: { from: string; to: string }[]
): Promise<{ fareSamples: { from: string; to: string; distanceKm: number }[] }> {
  const coordByCode = new Map(
    catalog.stations
      .filter((s) => s.latitude !== null && s.longitude !== null)
      .map((s) => [s.stationCode, { lat: s.latitude!, lng: s.longitude! }])
  );

  const lineByColor = new Map(
    catalog.lines.map((l) => [l.lineColor.toLowerCase(), l.lineCode])
  );

  // Per-hop haversine distance
  const distanceByHop = new Map<string, number>();
  for (const e of catalog.edges) {
    const c1 = coordByCode.get(e.fromCode);
    const c2 = coordByCode.get(e.toCode);
    if (c1 && c2) {
      distanceByHop.set(`${e.fromCode}-${e.toCode}`, haversineKm(c1.lat, c1.lng, c2.lat, c2.lng));
    }
  }

  // Per-hop time from route samples: key "LINE|A-B"
  const timeByHop = new Map<string, number>();
  const fareSamples: { from: string; to: string; distanceKm: number }[] = [];

  for (const pair of samplePairs) {
    try {
      const r = (await fetchDmrc(
        `new_fare_with_route/${pair.from}/${pair.to}/least-distance/`
      )) as DmrcFareRoute;

      for (const leg of r.route) {
        const lineCode = lineByColor.get(leg.line.toLowerCase());
        if (!lineCode) continue;
        const pathTime = parseDmrcTime(leg.path_time);
        const mapPath = leg["map-path"] ?? [];
        const hopCount = mapPath.length;
        if (pathTime === null || hopCount === 0) continue;
        const perHop = pathTime / hopCount;
        for (const hop of mapPath) {
          const [a, b] = hop.split("-");
          if (!a || !b) continue;
          const key = `${lineCode}|${a}-${b}`;
          const revKey = `${lineCode}|${b}-${a}`;
          const existing = timeByHop.get(key) ?? timeByHop.get(revKey);
          timeByHop.set(
            existing === undefined ? key : revKey,
            existing === undefined ? perHop : (existing + perHop) / 2
          );
        }
      }

      // Fare sample distance: sum of per-hop haversine along the route path.
      // The path gives station names, but we resolve codes via the catalog's
      // name -> code map. Fall back to straight-line when resolution fails.
      const nameToCode = catalog.nameToCode;
      const pathCodes: string[] = [];
      for (const leg of r.route) {
        for (const p of leg.path) {
          const code = nameToCode.get(p.name.toUpperCase());
          if (code) pathCodes.push(code);
        }
      }
      let distKm = 0;
      for (let i = 0; i < pathCodes.length - 1; i++) {
        const c1 = coordByCode.get(pathCodes[i]);
        const c2 = coordByCode.get(pathCodes[i + 1]);
        if (c1 && c2) distKm += haversineKm(c1.lat, c1.lng, c2.lat, c2.lng);
      }
      if (distKm > 0) {
        fareSamples.push({ from: pair.from, to: pair.to, distanceKm: distKm });
      } else {
        const c1 = coordByCode.get(pair.from);
        const c2 = coordByCode.get(pair.to);
        if (c1 && c2) {
          fareSamples.push({
            from: pair.from,
            to: pair.to,
            distanceKm: haversineKm(c1.lat, c1.lng, c2.lat, c2.lng),
          });
        }
      }
    } catch {
      // skip failed sample
    }
  }

  // Apply to edges
  for (const e of catalog.edges) {
    const hop = `${e.fromCode}-${e.toCode}`;
    const revHop = `${e.toCode}-${e.fromCode}`;
    const time = timeByHop.get(`${e.lineCode}|${hop}`) ?? timeByHop.get(`${e.lineCode}|${revHop}`);
    if (time !== undefined && time > 0) e.timeMin = Math.max(time, 1);
    const dist = distanceByHop.get(hop) ?? distanceByHop.get(revHop);
    if (dist !== undefined && dist > 0) e.distanceKm = dist;
  }

  return { fareSamples };
}

/** Publish the compiled graph to the Durable Object for in-memory routing. */
async function publishGraph(
  env: Env,
  catalog: SyncCatalog,
  brackets: FareBracket[]
): Promise<void> {
  const id = env.GRAPH.idFromName("network");
  const stub = env.GRAPH.get(id);
  await stub.fetch("http://graph/publish", {
    method: "POST",
    body: JSON.stringify({
      stations: catalog.stations.map((s) => ({ code: s.stationCode, name: s.name })),
      edges: catalog.edges.map((e) => ({
        from: e.fromCode,
        to: e.toCode,
        line: e.lineCode,
        time: e.timeMin,
        dist: e.distanceKm,
        direction: e.direction,
      })),
      lines: catalog.lines.map((l) => ({
        code: l.lineCode,
        name: l.lineColor,
        color: l.primaryColorCode ?? l.lineColor,
      })),
      platforms: catalog.platforms.map((p) => ({
        station: p.stationCode,
        line: p.lineCode,
        direction: p.direction,
        platformNo: p.platformNo,
      })),
      brackets,
    }),
  });
}

/** Build a spread of sample station pairs for edge-time + fare calibration. */
function buildSamplePairs(catalog: SyncCatalog): { from: string; to: string }[] {
  // Use the Yellow Line (LN2) as the sampling spine: it's a standard metro
  // line (no airport/rapid surcharge) spanning the full distance range.
  const spine = catalog.stations
    .filter((s) => s.lines.some((l) => l.lineCode === "LN2"))
    .map((s) => s.stationCode);
  if (spine.length < 3) {
    // Fallback: longest line by station count
    const longest = [...catalog.lines].sort(
      (a, b) => (b.stationCount ?? 0) - (a.stationCount ?? 0)
    )[0];
    const alt = catalog.stations
      .filter((s) => s.lines.some((l) => l.lineCode === longest?.lineCode))
      .map((s) => s.stationCode);
    return buildPairs(alt);
  }
  return buildPairs(spine);
}

function buildPairs(spine: string[]): { from: string; to: string }[] {
  const pairs: { from: string; to: string }[] = [];
  const seen = new Set<string>();
  const offsets = [2, 4, 6, 8, 10, 14, 18, 24, 30, 40, 50, 60];
  for (let i = 0; i < spine.length - 2 && pairs.length < ROUTE_SAMPLE_MAX; i += 5) {
    for (const off of offsets) {
      if (pairs.length >= ROUTE_SAMPLE_MAX) break;
      const b = spine[i + off];
      if (!b || b === spine[i]) continue;
      const key = `${spine[i]}|${b}`;
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({ from: spine[i], to: b });
      }
    }
  }
  return pairs;
}
