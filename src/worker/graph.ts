import type { Env } from "@/types";

export interface GraphStation {
  code: string;
  name: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  line: string;
  time: number;
  dist: number;
  /** "up" = towards the line's start terminal, "down" = towards its end. */
  direction: "up" | "down";
}

export interface GraphLine {
  code: string;
  name: string;
  color: string;
}

/** Platform for a station on a line in one travel direction. */
export interface GraphPlatform {
  station: string;
  line: string;
  direction: "up" | "down";
  platformNo: number;
}

export interface FareBracketDto {
  maxDistanceKm: number;
  fare: number;
}

export interface GraphData {
  stations: GraphStation[];
  edges: GraphEdge[];
  lines: GraphLine[];
  platforms: GraphPlatform[];
  brackets: FareBracketDto[];
}

export interface RouteSegmentDto {
  line: string;
  lineCode: string;
  color: string;
  stations: { code: string; name: string }[];
  timeMin: number;
  distanceKm: number;
  /** Platform to board at the segment's first station (origin/transfer). */
  fromPlatformNo: number | null;
  /** Platform to alight at the segment's last station (transfer/destination). */
  toPlatformNo: number | null;
}

export interface RouteResultDto {
  from: string;
  to: string;
  segments: RouteSegmentDto[];
  totalTimeMin: number;
  totalDistanceKm: number;
  fare: number;
  transfers: number;
}

interface NodeState {
  cost: number;
  prev?: string;
  prevLine?: string;
}

const DEFAULT_BRACKETS: FareBracketDto[] = [
  { maxDistanceKm: 2, fare: 20 },
  { maxDistanceKm: 5, fare: 30 },
  { maxDistanceKm: 12, fare: 40 },
  { maxDistanceKm: 21, fare: 50 },
  { maxDistanceKm: 32, fare: 60 },
  { maxDistanceKm: 9999, fare: 70 },
];

export class GraphDO {
  private state: DurableObjectState;
  private env: Env;
  private stations = new Map<string, GraphStation>();
  private edges = new Map<string, GraphEdge[]>(); // from -> edges
  private lines = new Map<string, GraphLine>();
  private platforms = new Map<string, number>(); // `${station}|${line}|${direction}` -> platformNo
  private brackets: FareBracketDto[] = DEFAULT_BRACKETS;
  private lastPublish = 0;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/publish") {
      return this.handlePublish(request);
    }
    if (request.method === "GET" && url.pathname === "/route") {
      return this.handleRoute(url);
    }
    if (request.method === "GET" && url.pathname === "/status") {
      return Response.json({
        stations: this.stations.size,
        edges: [...this.edges.values()].reduce((n, e) => n + e.length, 0),
        lines: this.lines.size,
        lastPublish: this.lastPublish,
      });
    }
    return new Response("Not found", { status: 404 });
  }

  private async handlePublish(request: Request): Promise<Response> {
    const data = (await request.json()) as GraphData;
    this.stations.clear();
    this.edges.clear();
    this.lines.clear();
    this.platforms.clear();
    for (const s of data.stations) this.stations.set(s.code, s);
    for (const e of data.edges) {
      if (!this.edges.has(e.from)) this.edges.set(e.from, []);
      this.edges.get(e.from)!.push(e);
    }
    for (const l of data.lines) this.lines.set(l.code, l);
    for (const p of data.platforms ?? []) {
      this.platforms.set(`${p.station}|${p.line}|${p.direction}`, p.platformNo);
    }
    if (data.brackets?.length) this.brackets = data.brackets;
    this.lastPublish = Date.now();
    // Persist a lightweight snapshot so the DO can serve after eviction.
    await this.state.storage.put("graph", {
      stations: [...this.stations.values()],
      edges: data.edges,
      lines: [...this.lines.values()],
      platforms: data.platforms ?? [],
      brackets: this.brackets,
      lastPublish: this.lastPublish,
    });
    return Response.json({ ok: true, stations: this.stations.size, edges: data.edges.length });
  }

  private async ensureLoaded(): Promise<void> {
    if (this.stations.size > 0) return;
    const snap = (await this.state.storage.get("graph")) as GraphData & { lastPublish: number } | null;
    if (!snap) return;
    this.stations.clear();
    this.edges.clear();
    this.lines.clear();
    this.platforms.clear();
    for (const s of snap.stations) this.stations.set(s.code, s);
    for (const e of snap.edges) {
      if (!this.edges.has(e.from)) this.edges.set(e.from, []);
      this.edges.get(e.from)!.push(e);
    }
    for (const l of snap.lines) this.lines.set(l.code, l);
    for (const p of snap.platforms ?? []) {
      this.platforms.set(`${p.station}|${p.line}|${p.direction}`, p.platformNo);
    }
    if (snap.brackets?.length) this.brackets = snap.brackets;
    this.lastPublish = snap.lastPublish;
  }

  private async handleRoute(url: URL): Promise<Response> {
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    if (!from || !to) return Response.json({ error: "from/to required" }, { status: 400 });
    if (from === to) {
      return Response.json({
        from,
        to,
        segments: [],
        totalTimeMin: 0,
        totalDistanceKm: 0,
        fare: 0,
        transfers: 0,
      });
    }
    await this.ensureLoaded();
    const result = this.dijkstra(from, to);
    if (!result) return Response.json({ error: "No route found" }, { status: 404 });
    return Response.json(result);
  }

  private dijkstra(from: string, to: string): RouteResultDto | null {
    if (!this.stations.has(from) || !this.stations.has(to)) return null;
    const dist = new Map<string, NodeState>();
    const visited = new Set<string>();
    dist.set(from, { cost: 0 });

    while (true) {
      let current: string | null = null;
      let best = Infinity;
      for (const [code, st] of dist) {
        if (!visited.has(code) && st.cost < best) {
          best = st.cost;
          current = code;
        }
      }
      if (current === null) break;
      if (current === to) break;
      visited.add(current);

      const neighbors = this.edges.get(current) ?? [];
      for (const edge of neighbors) {
        if (visited.has(edge.to)) continue;
        const cur = dist.get(current)!;
        const newCost = cur.cost + edge.time;
        const existing = dist.get(edge.to);
        if (!existing || newCost < existing.cost) {
          dist.set(edge.to, { cost: newCost, prev: current, prevLine: edge.line });
        }
      }
    }

    const target = dist.get(to);
    if (!target || target.cost === Infinity) return null;

    // Reconstruct path
    const stationPath: string[] = [];
    const linePath: string[] = [];
    let cur: string | undefined = to;
    while (cur && cur !== from) {
      stationPath.push(cur);
      const node = dist.get(cur);
      if (!node?.prev) break;
      if (!node.prevLine) throw new Error("Missing prevLine in path");
      linePath.push(node.prevLine);
      cur = node.prev;
    }
    stationPath.push(from);
    stationPath.reverse();
    linePath.reverse();

    // Build segments by continuous line
    const segments: RouteSegmentDto[] = [];
    let currentLine = linePath[0];
    let currentDirection: "up" | "down" = "down";
    const firstEdge = (this.edges.get(stationPath[0]) ?? []).find(
      (e) => e.to === stationPath[1] && e.line === linePath[0]
    );
    if (firstEdge) currentDirection = firstEdge.direction;
    let currentStations = [this.stations.get(stationPath[0])!];
    let currentTime = 0;
    let currentDist = 0;

    const finishSegment = () => {
      const startCode = currentStations[0].code;
      const endCode = currentStations[currentStations.length - 1].code;
      segments.push({
        line: this.lines.get(currentLine)?.name ?? currentLine,
        lineCode: currentLine,
        color: this.lines.get(currentLine)?.color ?? "#888",
        stations: currentStations,
        timeMin: currentTime,
        distanceKm: currentDist,
        fromPlatformNo: this.platformNo(startCode, currentLine, currentDirection),
        toPlatformNo: this.platformNo(endCode, currentLine, currentDirection),
      });
    };

    for (let i = 0; i < linePath.length; i++) {
      const edgeLine = linePath[i];
      const fromId = stationPath[i];
      const toId = stationPath[i + 1];
      const edge = (this.edges.get(fromId) ?? []).find(
        (e) => e.to === toId && e.line === edgeLine
      );
      if (!edge) continue;

      if (edgeLine === currentLine) {
        currentStations.push(this.stations.get(toId)!);
        currentTime += edge.time;
        currentDist += edge.dist;
      } else {
        finishSegment();
        currentLine = edgeLine;
        currentDirection = edge.direction;
        currentStations = [this.stations.get(fromId)!, this.stations.get(toId)!];
        currentTime = edge.time;
        currentDist = edge.dist;
      }
    }
    finishSegment();

    const totalTimeMin = segments.reduce((s, seg) => s + seg.timeMin, 0);
    const totalDistanceKm = segments.reduce((s, seg) => s + seg.distanceKm, 0);
    const fare = this.fareForDistance(totalDistanceKm);
    const transfers = Math.max(segments.length - 1, 0);

    return {
      from,
      to,
      segments,
      totalTimeMin,
      totalDistanceKm,
      fare,
      transfers,
    };
  }

  private fareForDistance(distanceKm: number): number {
    for (const b of this.brackets) {
      if (distanceKm <= b.maxDistanceKm) return b.fare;
    }
    return this.brackets[this.brackets.length - 1]?.fare ?? 70;
  }

  /** Platform number for a station on a line in a given direction, if known. */
  private platformNo(
    station: string,
    line: string,
    direction: "up" | "down"
  ): number | null {
    return this.platforms.get(`${station}|${line}|${direction}`) ?? null;
  }
}
