// lib/routing.ts
import { EDGES } from "@/data/edges";
import {
  LINE_COLORS,
  STATION_BY_ID,
  type LineId,
  type Station,
  type StationId,
} from "@/data/stations";
import { calculateFare } from "./fare";

interface NodeState {
  cost: number; // time in minutes
  prev?: StationId;
  prevLine?: LineId;
}

export interface Segment {
  line: LineId;
  color: string;
  stations: Station[];
  timeMin: number;
  distanceKm: number;
}

export interface RouteResult {
  segments: Segment[];
  totalTimeMin: number;
  totalDistanceKm: number;
  fareEstimate: number;
  transfers: number;
}

function buildAdjacency() {
  const adj = new Map<StationId, typeof EDGES>();
  for (const edge of EDGES) {
    if (!adj.has(edge.from)) adj.set(edge.from, []);
    adj.get(edge.from)!.push(edge);
  }
  return adj;
}

const ADJ = buildAdjacency();

export function findRoute(
  from: StationId,
  to: StationId
): RouteResult | null {
  if (from === to) {
    const station = STATION_BY_ID[from];
    const segments: Segment[] = [
      {
        line: station.lines[0],
        color: LINE_COLORS[station.lines[0]],
        stations: [station],
        timeMin: 0,
        distanceKm: 0,
      },
    ];
    return {
      segments,
      totalTimeMin: 0,
      totalDistanceKm: 0,
      fareEstimate: 0,
      transfers: 0,
    };
  }

  const dist: Record<StationId, NodeState> = {} as Record<StationId, NodeState>;
  const visited = new Set<StationId>();

  // Initialise
  Object.keys(STATION_BY_ID).forEach((id) => {
    dist[id as StationId] = { cost: Infinity };
  });
  dist[from].cost = 0;

  const allIds = Object.keys(STATION_BY_ID) as StationId[];

  while (true) {
    let current: StationId | null = null;
    let currentCost = Infinity;

    for (const id of allIds) {
      if (!visited.has(id) && dist[id].cost < currentCost) {
        currentCost = dist[id].cost;
        current = id;
      }
    }

    if (!current) break;
    if (current === to) break;

    visited.add(current);

    const edges = ADJ.get(current);
    if (!edges) continue;

    for (const edge of edges) {
      const next = edge.to;
      if (visited.has(next)) continue;

      const newCost = dist[current].cost + edge.timeMin;
      if (newCost < dist[next].cost) {
        dist[next] = {
          cost: newCost,
          prev: current,
          prevLine: edge.line,
        };
      }
    }
  }

  if (dist[to].cost === Infinity) return null;

  // Reconstruct path
  const stationPath: StationId[] = [];
  const linePath: LineId[] = [];

  let cur: StationId | undefined = to;
  while (cur && cur !== from) {
    stationPath.push(cur);
    const node: any = dist[cur];
    if (!node.prev) break;
    if (!node.prevLine) throw new Error("Missing prevLine in path");
    linePath.push(node.prevLine);
    cur = node.prev;
  }
  stationPath.push(from);
  stationPath.reverse();
  linePath.reverse(); // edge lines (between i and i+1)

  // Build segments (group by continuous line)
  const segments: Segment[] = [];
  let currentLine = linePath[0];
  let currentStations: Station[] = [STATION_BY_ID[stationPath[0]]];
  let currentTime = 0;
  let currentDistance = 0;

  for (let i = 0; i < linePath.length; i++) {
    const edgeLine = linePath[i];
    const fromId = stationPath[i];
    const toId = stationPath[i + 1];
    const edge = EDGES.find(
      (e) => e.from === fromId && e.to === toId && e.line === edgeLine
    );
    if (!edge) continue;

    if (edgeLine === currentLine) {
      currentStations.push(STATION_BY_ID[toId]);
      currentTime += edge.timeMin;
      currentDistance += edge.distanceKm;
    } else {
      segments.push({
        line: currentLine,
        color: LINE_COLORS[currentLine],
        stations: currentStations,
        timeMin: currentTime,
        distanceKm: currentDistance,
      });
      currentLine = edgeLine;
      currentStations = [STATION_BY_ID[fromId], STATION_BY_ID[toId]];
      currentTime = edge.timeMin;
      currentDistance = edge.distanceKm;
    }
  }

  // Push last segment
  segments.push({
    line: currentLine,
    color: LINE_COLORS[currentLine],
    stations: currentStations,
    timeMin: currentTime,
    distanceKm: currentDistance,
  });

  const totalTimeMin = segments.reduce((s, seg) => s + seg.timeMin, 0);
  const totalDistanceKm = segments.reduce((s, seg) => s + seg.distanceKm, 0);
  const fareEstimate = calculateFare(totalDistanceKm);
  const transfers = Math.max(segments.length - 1, 0);

  return {
    segments,
    totalTimeMin,
    totalDistanceKm,
    fareEstimate,
    transfers,
  };
}
