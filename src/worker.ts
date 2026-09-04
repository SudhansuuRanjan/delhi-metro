import { Hono } from "hono";
import { eq, or, like, inArray } from "drizzle-orm";
import { createD1, schema } from "@/db";
import type { Env } from "@/types";
import { runSync } from "@/lib/sync";
import { GraphDO } from "./worker/graph";

const app = new Hono<{ Bindings: Env }>();

/* ---------- Public API ---------- */

// Station search
app.get("/api/stations", async (c) => {
  const q = (c.req.query("q") ?? "").trim().toUpperCase();
  const db = createD1(c.env.DB);

  // Fast path: serve from KV catalog
  const cached = await c.env.CACHE.get("cache:stations");
  if (cached) {
    const all = JSON.parse(cached) as { code: string; name: string }[];
    const filtered = q
      ? all
          .filter((s) => s.code.includes(q) || s.name.toUpperCase().includes(q))
          .slice(0, 50)
      : all;
    return c.json(filtered);
  }

  const rows = await db
    .select({ code: schema.stations.stationCode, name: schema.stations.name })
    .from(schema.stations)
    .where(
      q
        ? or(like(schema.stations.stationCode, `%${q}%`), like(schema.stations.name, `%${q}%`))
        : undefined
    )
    .limit(q ? 50 : 500);
  return c.json(rows.map((r) => ({ code: r.code, name: r.name })));
});

// All lines
app.get("/api/lines", async (c) => {
  const cached = await c.env.CACHE.get("cache:lines");
  if (cached) return c.json(JSON.parse(cached));

  const db = createD1(c.env.DB);
  const rows = await db
    .select({
      code: schema.lines.lineCode,
      name: schema.lines.lineColor, // friendly color name, e.g. "Yellow Line"
      color: schema.lines.primaryColorCode ?? schema.lines.lineColor,
    })
    .from(schema.lines)
    .where(eq(schema.lines.showInFrontend, true))
    .orderBy(schema.lines.orderIndex);
  return c.json(rows);
});

// Ordered stations on a line
app.get("/api/line/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const db = createD1(c.env.DB);
  const rows = await db
    .select({
      code: schema.stationLines.stationCode,
      order: schema.stationLines.orderIndex,
    })
    .from(schema.stationLines)
    .where(eq(schema.stationLines.lineCode, code))
    .orderBy(schema.stationLines.orderIndex);
  const codes = rows.map((r) => r.code);
  if (codes.length === 0) return c.json([]);

  const stations = await db
    .select({
      code: schema.stations.stationCode,
      name: schema.stations.name,
      interchange: schema.stations.interchange,
      stationType: schema.stations.stationType,
    })
    .from(schema.stations)
    .where(inArray(schema.stations.stationCode, codes));

  // Other lines serving each station (for interchange badges + multi-line dots).
  const lineRows = codes.length
    ? await db
        .select({
          stationCode: schema.stationLines.stationCode,
          lineCode: schema.stationLines.lineCode,
          name: schema.lines.lineColor,
          color: schema.lines.primaryColorCode ?? schema.lines.lineColor,
        })
        .from(schema.stationLines)
        .innerJoin(schema.lines, eq(schema.stationLines.lineCode, schema.lines.lineCode))
        .where(inArray(schema.stationLines.stationCode, codes))
    : [];
  const linesByStation = new Map<string, { code: string; name: string; color: string }[]>();
  for (const lr of lineRows) {
    const arr = linesByStation.get(lr.stationCode) ?? [];
    arr.push({ code: lr.lineCode, name: lr.name, color: lr.color ?? "#888" });
    linesByStation.set(lr.stationCode, arr);
  }

  const byCode = new Map(stations.map((s) => [s.code, s]));
  return c.json(
    rows.map((r) => {
      const st = byCode.get(r.code);
      const lines = (linesByStation.get(r.code) ?? []).filter((l) => l.code !== code);
      return {
        code: r.code,
        name: st?.name ?? r.code,
        interchange: !!st?.interchange,
        stationType: st?.stationType ?? null,
        otherLines: lines,
      };
    })
  );
});

// Station detail
app.get("/api/station/:code", async (c) => {
  const code = c.req.param("code").toUpperCase();
  const db = createD1(c.env.DB);
  const station = await db
    .select()
    .from(schema.stations)
    .where(eq(schema.stations.stationCode, code))
    .get();
  if (!station) return c.json({ error: "Station not found" }, 404);

  const lines = await db
    .select({
      code: schema.lines.lineCode,
      name: schema.lines.lineColor,
      color: schema.lines.primaryColorCode ?? schema.lines.lineColor,
    })
    .from(schema.lines)
    .innerJoin(schema.stationLines, eq(schema.stationLines.lineCode, schema.lines.lineCode))
    .where(eq(schema.stationLines.stationCode, code));

  const timing = await db
    .select()
    .from(schema.stationTimings)
    .where(eq(schema.stationTimings.stationCode, code))
    .get();

  const dayTimings = await db
    .select({
      dayGroup: schema.stationDayTimings.dayGroup,
      towardsCode: schema.stationDayTimings.towardsCode,
      towardsName: schema.stationDayTimings.towardsName,
      firstTrainTime: schema.stationDayTimings.firstTrainTime,
      lastTrainTime: schema.stationDayTimings.lastTrainTime,
    })
    .from(schema.stationDayTimings)
    .where(eq(schema.stationDayTimings.stationCode, code))
    .all();

  const facilities = await db
    .select()
    .from(schema.stationFacilities)
    .where(eq(schema.stationFacilities.stationCode, code))
    .get();

  // Adjacent stations from edges
  const adjRows = await db
    .select({
      toCode: schema.edges.toCode,
      lineCode: schema.edges.lineCode,
      timeMin: schema.edges.timeMin,
      distanceKm: schema.edges.distanceKm,
    })
    .from(schema.edges)
    .where(eq(schema.edges.fromCode, code))
    .limit(20);
  const adjCodes = adjRows.map((r) => r.toCode);
  const adjStations = adjCodes.length
    ? await db
        .select({ code: schema.stations.stationCode, name: schema.stations.name })
        .from(schema.stations)
        .where(inArray(schema.stations.stationCode, adjCodes))
    : [];
  const adjName = new Map(adjStations.map((s) => [s.code, s.name]));

  const parseJson = <T>(v: string | null, fallback: T): T => {
    if (!v) return fallback;
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  };

  return c.json({
    code: station.stationCode,
    name: station.name,
    commercialName: station.commercialName,
    latitude: station.latitude,
    longitude: station.longitude,
    stationType: station.stationType,
    interchange: !!station.interchange,
    status: station.status,
    openingTime: station.openingTime,
    closingTime: station.closingTime,
    lines: lines.map((l) => ({ code: l.code, name: l.name, color: l.color })),
    firstTrain: timing?.firstTrain ?? null,
    lastTrain: timing?.lastTrain ?? null,
    dayTimings: dayTimings.map((t) => ({
      dayGroup: t.dayGroup,
      towardsCode: t.towardsCode,
      towardsName: t.towardsName,
      firstTrainTime: t.firstTrainTime,
      lastTrainTime: t.lastTrainTime,
    })),
    adjacent: adjRows.map((r) => ({
      code: r.toCode,
      name: adjName.get(r.toCode) ?? r.toCode,
      lineCode: r.lineCode,
      timeMin: r.timeMin,
      distanceKm: r.distanceKm,
    })),
    facilities: {
      description: facilities?.description ?? null,
      mobile: facilities?.mobile ?? null,
      landline: facilities?.landline ?? null,
      amenities: parseJson<string[]>(facilities?.amenities ?? null, []),
      gates: parseJson<{ name: string; location: string | null; divyangFriendly: boolean; status: string | null }[]>(facilities?.gates ?? null, []),
      lifts: parseJson<{ type: string; name: string; location: string | null; availableOutsideInside: string | null }[]>(facilities?.lifts ?? null, []),
      parking: parseJson<{ provider: string | null; location: string | null; car: number | null; motorcycle: number | null; cycle: number | null }[]>(facilities?.parking ?? null, []),
    },
  });
});

// Full network geometry for the route map page: one ordered station list
// per line with map coords + interchange flags, plus the line legend.
app.get("/api/network", async (c) => {
  const cached = await c.env.CACHE.get("cache:network");
  if (cached) return c.json(JSON.parse(cached));

  const db = createD1(c.env.DB);
  const lineRows = await db
    .select({
      code: schema.lines.lineCode,
      name: schema.lines.lineColor,
      color: schema.lines.primaryColorCode ?? schema.lines.lineColor,
      order: schema.lines.orderIndex,
    })
    .from(schema.lines)
    .where(eq(schema.lines.showInFrontend, true))
    .orderBy(schema.lines.orderIndex);

  const stationLineRows = await db
    .select({
      stationCode: schema.stationLines.stationCode,
      lineCode: schema.stationLines.lineCode,
      order: schema.stationLines.orderIndex,
    })
    .from(schema.stationLines)
    .all();

  const stationRows = await db
    .select({
      code: schema.stations.stationCode,
      name: schema.stations.name,
      latitude: schema.stations.latitude,
      longitude: schema.stations.longitude,
      x: schema.stations.xCoords,
      y: schema.stations.yCoords,
      interchange: schema.stations.interchange,
    })
    .from(schema.stations)
    .all();

  const stationByCode = new Map(stationRows.map((s) => [s.code, s]));
  const linesByStation = new Map<string, string[]>();
  for (const sl of stationLineRows) {
    const arr = linesByStation.get(sl.stationCode) ?? [];
    arr.push(sl.lineCode);
    linesByStation.set(sl.stationCode, arr);
  }

  const lines = lineRows.map((l) => {
    const ordered = stationLineRows
      .filter((sl) => sl.lineCode === l.code)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const stations = ordered
      .map((sl) => stationByCode.get(sl.stationCode))
      .filter((s) => s !== undefined)
      .map((s) => ({
        code: s.code,
        name: s.name,
        lat: s.latitude,
        lng: s.longitude,
        x: s.x,
        y: s.y,
        interchange: !!s.interchange,
        lines: linesByStation.get(s.code) ?? [],
      }));
    return {
      code: l.code,
      name: l.name,
      color: l.color ?? "#888",
      stations,
    };
  });

  const payload = { lines };
  await c.env.CACHE.put("cache:network", JSON.stringify(payload), {
    expirationTtl: 4 * 3600,
  }).catch(() => {});
  return c.json(payload);
});

// Route planning via the Durable Object (in-memory graph)
app.post("/api/route", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { from?: string; to?: string };
  const from = (body.from ?? "").toUpperCase();
  const to = (body.to ?? "").toUpperCase();
  if (!from || !to) return c.json({ error: "from/to required" }, 400);
  if (from === to) return c.json({ error: "same station" }, 400);

  const id = c.env.GRAPH.idFromName("network");
  const stub = c.env.GRAPH.get(id);
  const url = `http://graph/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
  const res = await stub.fetch(url);
  const json = (await res.json()) as unknown;
  return c.json(json, res.status as 200 | 400 | 404 | 500);
});

// Sync status for the UI badge
app.get("/api/status", async (c) => {
  const cached = await c.env.CACHE.get("cache:lastSync");
  if (cached) return c.json(JSON.parse(cached));

  const db = createD1(c.env.DB);
  const lastSync = await db
    .select()
    .from(schema.syncMeta)
    .where(eq(schema.syncMeta.key, "lastSync"))
    .get();
  const counts = await db
    .select({ lines: schema.lines.lineCode })
    .from(schema.lines)
    .all();
  return c.json({
    lastSync: Number(lastSync?.value ?? 0),
    stations: 0,
    edges: 0,
    lines: counts.length,
  });
});

/* ---------- Internal ---------- */

// Manual sync trigger (guarded by CRON_SECRET)
app.post("/api/internal/sync", async (c) => {
  const secret = c.req.header("x-cron-secret");
  if (!c.env.CRON_SECRET || secret !== c.env.CRON_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const result = await runSync(c.env);
    return c.json(result);
  } catch (err) {
    console.error(err);
    return c.json({ error: err instanceof Error ? err.message : "sync failed" }, 500);
  }
});

// Health
app.get("/api/health", (c) => c.json({ ok: true }));

// All non-API routes fall through to the static asset handler (SPA).
app.all("*", async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default {
  fetch: app.fetch,
  scheduled: async (controller: ScheduledController, env: Env) => {
    try {
      const result = await runSync(env);
      console.log("sync complete", JSON.stringify(result));
    } catch (err) {
      console.error("scheduled sync failed", err);
    }
  },
};

export { GraphDO };
