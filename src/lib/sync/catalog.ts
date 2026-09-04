import { fetchDmrc, mapWithConcurrency } from "../dmrc";
import type {
  DmrcLine,
  DmrcLineDetail,
  DmrcStationByLine,
  DmrcStationDetail,
} from "../dmrcTypes";
import { haversineKm, parseDmrcTime } from "../geo";

export interface SyncStation {
  stationCode: string;
  name: string;
  commercialName: string | null;
  latitude: number | null;
  longitude: number | null;
  xCoords: number | null;
  yCoords: number | null;
  stationType: string | null;
  interchange: boolean;
  status: string | null;
  openingTime: string | null;
  closingTime: string | null;
  lines: { lineCode: string; orderIndex: number }[];
  firstTrain: string | null;
  lastTrain: string | null;
  /** Per-day first/last train per travel direction (weekdays/saturday/sunday). */
  dayTimings: SyncDayTiming[];
  /** Rich metadata from the station detail endpoint. */
  facilities: SyncStationFacilities;
}

/** One per-day first/last train entry pointing at a travel direction. */
export interface SyncDayTiming {
  dayGroup: "weekdays" | "saturday" | "sunday";
  towardsCode: string | null;
  towardsName: string | null;
  firstTrainTime: string | null;
  lastTrainTime: string | null;
}

export interface SyncStationFacilities {
  description: string | null;
  mobile: string | null;
  landline: string | null;
  amenities: string[];
  gates: {
    name: string;
    location: string | null;
    divyangFriendly: boolean;
    status: string | null;
  }[];
  lifts: {
    type: string;
    name: string;
    location: string | null;
    availableOutsideInside: string | null;
  }[];
  parking: {
    provider: string | null;
    location: string | null;
    car: number | null;
    motorcycle: number | null;
    cycle: number | null;
  }[];
}

export interface SyncLine {
  lineCode: string;
  name: string;
  lineColor: string;
  primaryColorCode: string | null;
  secondaryColorCode: string | null;
  startStation: string | null;
  endStation: string | null;
  showInFrontend: boolean;
  status: string | null;
  orderIndex: number;
  distance: number | null;
  timeTravel: number | null;
  fare: number | null;
  specialFare: number | null;
  stationCount: number | null;
}

export interface SyncEdge {
  fromCode: string;
  toCode: string;
  lineCode: string;
  timeMin: number;
  distanceKm: number;
  /** "up" = towards the line's start terminal, "down" = towards its end. */
  direction: "up" | "down";
}

/** Platform number for a station on a line in one travel direction. */
export interface SyncPlatform {
  stationCode: string;
  lineCode: string;
  direction: "up" | "down";
  platformNo: number;
}

export interface SyncCatalog {
  lines: SyncLine[];
  stations: SyncStation[];
  edges: SyncEdge[];
  /** Platform info captured from DMRC station_route responses. */
  platforms: SyncPlatform[];
  /** lineCode -> (fromCode-toCode -> timeMin) for every hop on that line */
  hopTimes: Map<string, Map<string, number>>;
  /** station name (upper) -> station code, for resolving route path names */
  nameToCode: Map<string, string>;
  /** Raw probe of prev_next_stations for shape verification */
  probe: unknown;
}

/**
 * Fetch all lines and their ordered stations, then fetch each station's detail
 * to gather coordinates, interchange info, first/last train, and adjacency.
 *
 * The `prev_next_stations` payload carries no per-hop time/distance, so we
 * derive hop times from the route API (path_time evenly split over hops) and
 * distances from haversine (calibrated later against line totals).
 */
export async function fetchCatalog(): Promise<SyncCatalog> {
  const lines = (await fetchDmrc("line_list")) as DmrcLine[];

  const lineDetails = await mapWithConcurrency(lines, 5, async (line) => {
    try {
      return (await fetchDmrc(`metro_line/${line.line_code}`)) as DmrcLineDetail[];
    } catch {
      return null;
    }
  });

  const syncLines: SyncLine[] = lines.map((l, i) => {
    const detail = lineDetails[i]?.[0];
    return {
      lineCode: l.line_code,
      name: l.name,
      lineColor: l.line_color,
      primaryColorCode: l.primary_color_code,
      secondaryColorCode: l.secondary_color_code,
      startStation: l.start_station,
      endStation: l.end_station,
      showInFrontend: l.show_in_frontend ?? true,
      status: l.status,
      orderIndex: i,
      distance: detail?.distance ?? null,
      timeTravel: detail?.time_travel ?? null,
      fare: detail?.fare ?? null,
      specialFare: detail?.special_fare ?? null,
      stationCount: detail?.station_count ?? null,
    };
  });

  // Stations by line (ordered). Prefer station_by_line_linepage, fall back to station_by_line.
  const stationLists = await mapWithConcurrency(lines, 5, async (line) => {
    try {
      return ((await fetchDmrc(
        `station_by_line_linepage/${line.line_code}`
      )) as DmrcStationByLine[]).filter((s) => !!s.station_code);
    } catch {
      return ((await fetchDmrc(`station_by_line/${line.line_code}`)) as DmrcStationByLine[]).filter((s) => !!s.station_code);
    }
  });

  // Unique station codes across all lines, preserving order (skip nulls)
  const seen = new Set<string>();
  const uniqueCodes: string[] = [];
  for (const list of stationLists) {
    for (const s of list) {
      if (!s.station_code) continue;
      if (!seen.has(s.station_code)) {
        seen.add(s.station_code);
        uniqueCodes.push(s.station_code);
      }
    }
  }

  // Fetch station details
  const details = await mapWithConcurrency(uniqueCodes, 10, async (code) => {
    try {
      return (await fetchDmrc(`station/${code}`)) as DmrcStationDetail;
    } catch {
      return null;
    }
  });

  const detailByCode = new Map<string, DmrcStationDetail>();
  for (const d of details) {
    if (d) detailByCode.set(d.station_code, d);
  }

  // Probe: first station's prev_next_stations shape
  const probe = detailByCode.values().next().value?.prev_next_stations ?? null;

  const findStationRef = (code: string): DmrcStationByLine | undefined => {
    for (const list of stationLists) {
      const hit = list.find((s) => s.station_code === code);
      if (hit) return hit;
    }
    return undefined;
  };
  const findStationName = (code: string): string | undefined =>
    findStationRef(code)?.station_name;
  const findInterchange = (code: string): boolean | undefined =>
    findStationRef(code)?.interchange;
  const findStatus = (code: string): string | undefined =>
    findStationRef(code)?.status;

  // Build stations
  const stations: SyncStation[] = uniqueCodes.map((code) => {
    const d = detailByCode.get(code);
    const linesOnStation: SyncStation["lines"] = [];
    for (let li = 0; li < stationLists.length; li++) {
      const list = stationLists[li];
      const idx = list.findIndex((s) => s.station_code === code);
      if (idx >= 0) {
        linesOnStation.push({ lineCode: lines[li].line_code, orderIndex: idx });
      }
    }
    // Also add lines from station detail metro_lines if missing
    if (d?.metro_lines) {
      for (const ml of d.metro_lines) {
        if (!linesOnStation.some((x) => x.lineCode === ml.line_code)) {
          linesOnStation.push({
            lineCode: ml.line_code,
            orderIndex: linesOnStation.length,
          });
        }
      }
    }

    const firstLast = (Array.isArray(d?.first_last_train) ? d!.first_last_train : []) as {
      weekdays?: unknown[];
      saturday?: unknown[];
      sunday?: unknown[];
    }[];
    // first_last_train is keyed by day group with per-direction entries; extract
    // the first train time if present, otherwise leave null.
    const firstTrain = firstLast
      .flatMap((g) => [...(g.weekdays ?? []), ...(g.saturday ?? []), ...(g.sunday ?? [])])
      .find((x) => typeof x === "object" && x !== null && (x as { first_train?: string }).first_train);
    const lastTrain = firstLast
      .flatMap((g) => [...(g.weekdays ?? []), ...(g.saturday ?? []), ...(g.sunday ?? [])])
      .find((x) => typeof x === "object" && x !== null && (x as { last_train?: string }).last_train);
    const dayTimings = extractDayTimings(d?.first_last_train);
    return {
      stationCode: code,
      name: d?.station_name ?? findStationName(code) ?? code,
      commercialName: d?.station_commercial_name ?? null,
      latitude: d?.latitude ?? null,
      longitude: d?.longitude ?? null,
      xCoords: d?.x_coords ?? null,
      yCoords: d?.y_coords ?? null,
      stationType: d?.station_type ?? null,
      interchange: d?.interchange ?? findInterchange(code) ?? false,
      status: d?.status ?? findStatus(code) ?? null,
      openingTime: d?.opening_time ?? null,
      closingTime: d?.closing_time ?? null,
      lines: linesOnStation,
      firstTrain: (firstTrain as { first_train?: string } | undefined)?.first_train ?? null,
      lastTrain: (lastTrain as { last_train?: string } | undefined)?.last_train ?? null,
      dayTimings,
      facilities: extractFacilities(d),
    };
  });

  // Adjacent pairs from each line's ordered station list
  const adjacency = new Map<string, string[]>(); // code -> line codes
  const hopTimes = new Map<string, Map<string, number>>();
  const edges: SyncEdge[] = [];

  for (let li = 0; li < stationLists.length; li++) {
    const list = stationLists[li];
    const lineCode = lines[li].line_code;
    for (let j = 0; j < list.length - 1; j++) {
      const a = list[j].station_code;
      const b = list[j + 1].station_code;
      if (!a || !b) continue;
      // station_by_line lists run start -> end; "up" heads towards the
      // start terminal, "down" towards the end terminal.
      edges.push({ fromCode: a, toCode: b, lineCode, timeMin: 2, distanceKm: 1.1, direction: "down" });
      edges.push({ fromCode: b, toCode: a, lineCode, timeMin: 2, distanceKm: 1.1, direction: "up" });
      adjacency.set(a, [...(adjacency.get(a) ?? []), lineCode]);
      adjacency.set(b, [...(adjacency.get(b) ?? []), lineCode]);
    }
  }

  return {
    lines: syncLines,
    stations,
    edges,
    platforms: derivePlatforms(stations, detailByCode, syncLines, stationLists),
    hopTimes,
    nameToCode: new Map(
      stations.map((s) => [s.name.toUpperCase(), s.stationCode])
    ),
    probe,
  };
}

/**
 * Derive per-station platform numbers from the station detail payload.
 *
 * Each station's `platforms[]` entry has a `train_towards` terminal code.
 * Direction is resolved against the line's *ordered* station list (the same
 * order the edges use): a train running towards the station at index 0 is
 * "up", towards the last station is "down". We deliberately do NOT use the
 * line's start_station/end_station fields — DMRC returns those reversed for
 * some lines, while station_by_line is consistently ordered.
 */
function derivePlatforms(
  stations: SyncStation[],
  detailByCode: Map<string, DmrcStationDetail>,
  lines: SyncLine[],
  stationLists: DmrcStationByLine[][]
): SyncPlatform[] {
  const out: SyncPlatform[] = [];
  const seen = new Set<string>();

  // lineCode -> ordered station codes (index 0 = "up" terminal)
  const orderByLine = new Map<string, string[]>();
  for (let li = 0; li < stationLists.length; li++) {
    orderByLine.set(
      lines[li]?.lineCode ?? "",
      stationLists[li].map((s) => s.station_code)
    );
  }

  for (const st of stations) {
    const d = detailByCode.get(st.stationCode);
    const platformList = d?.platforms ?? [];
    if (platformList.length === 0) continue;

    for (const p of platformList) {
      const towards = p.train_towards?.station_code;
      if (!towards) continue;
      const match = parsePlatformNo(p.platform_name);
      if (match === null) continue;

      // Match against lines serving this station where the towards-terminal
      // is an *endpoint* of that line. This avoids false matches where a
      // terminal of one line (e.g. KG on LN6) is only a mid-station on another
      // line also passing through here (LN2).
      for (const { lineCode } of st.lines) {
        const order = orderByLine.get(lineCode);
        if (!order) continue;
        const first = order[0];
        const last = order[order.length - 1];
        let direction: "up" | "down" | null = null;
        if (towards === first) direction = "up";
        else if (towards === last) direction = "down";
        if (!direction) continue;
        const key = `${st.stationCode}|${lineCode}|${direction}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ stationCode: st.stationCode, lineCode, direction, platformNo: match });
      }
    }
  }
  return out;
}

/** Parse "Platform No. 3" / "Platform No. 1 (Airport Express)" -> 3. */
function parsePlatformNo(name: string | null): number | null {
  if (!name) return null;
  const m = name.match(/No\.?\s*(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

/** Extract per-day first/last train entries from DMRC `first_last_train`.
 * Shape: [{ weekdays: [{ towards: {station_code, station_name},
 * first_train_time, last_train_time }] }, { saturday: [...] }, { sunday: [...] }].
 * Entries without times are skipped; stations with no data yield []. */
export function extractDayTimings(
  raw: DmrcStationDetail["first_last_train"] | undefined
): SyncDayTiming[] {
  if (!Array.isArray(raw)) return [];
  const out: SyncDayTiming[] = [];
  const seen = new Set<string>();
  const groups = ["weekdays", "saturday", "sunday"] as const;
  for (const group of raw) {
    if (typeof group !== "object" || group === null) continue;
    for (const day of groups) {
      const entries = (group as Record<string, unknown>)[day];
      if (!Array.isArray(entries)) continue;
      for (const e of entries) {
        if (typeof e !== "object" || e === null) continue;
        const rec = e as {
          towards?: { station_code?: string | null; station_name?: string | null } | null;
          first_train_time?: string | null;
          last_train_time?: string | null;
        };
        const first = rec.first_train_time ?? null;
        const last = rec.last_train_time ?? null;
        if (!first && !last) continue;
        const towardsCode = rec.towards?.station_code ?? null;
        const key = `${day}|${towardsCode ?? ""}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          dayGroup: day,
          towardsCode,
          towardsName: rec.towards?.station_name ?? null,
          firstTrainTime: first,
          lastTrainTime: last,
        });
      }
    }
  }
  return out;
}

/** Extract rich station metadata from the DMRC station detail payload. */
function extractFacilities(d: DmrcStationDetail | undefined): SyncStationFacilities {
  if (!d) {
    return {
      description: null,
      mobile: null,
      landline: null,
      amenities: [],
      gates: [],
      lifts: [],
      parking: [],
    };
  }
  const amenities = (Array.isArray(d.station_facility) ? d.station_facility : [])
    .map((f) => f?.name)
    .filter((n): n is string => !!n);

  const gates = (Array.isArray(d.gates) ? d.gates : []).map((g) => ({
    name: g.gate_name ?? "",
    location: g.location ?? null,
    divyangFriendly: !!g.divyang_friendly,
    status: g.status ?? null,
  }));

  const lifts = (Array.isArray(d.lifts) ? d.lifts : []).map((l) => ({
    type: l.lift_type ?? "",
    name: l.name ?? "",
    location: l.description_location ?? null,
    availableOutsideInside: l.available_outside_inside ?? null,
  }));

  const parking = (Array.isArray(d.parkings) ? d.parkings : []).map((p) => ({
    provider: p.provider ?? null,
    location: p.location ?? null,
    car: p.capacity_car ?? null,
    motorcycle: p.capacity_motorcycle ?? null,
    cycle: p.capacity_cycle ?? null,
  }));

  return {
    description: d.station_description ?? null,
    mobile: d.mobile ?? null,
    landline: d.landline ?? null,
    amenities,
    gates,
    lifts,
    parking,
  };
}
