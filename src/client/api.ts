export interface StationRef {
  code: string;
  name: string;
}

export interface LineRef {
  code: string;
  name: string;
  color: string;
}

export interface RouteSegment {
  line: string;
  lineCode: string;
  color: string;
  stations: StationRef[];
  timeMin: number;
  distanceKm: number;
  /** Platform to board at the segment's first station (origin/transfer). */
  fromPlatformNo: number | null;
  /** Platform to alight at the segment's last station (transfer/destination). */
  toPlatformNo: number | null;
}

export interface RouteResult {
  from: string;
  to: string;
  segments: RouteSegment[];
  totalTimeMin: number;
  totalDistanceKm: number;
  fare: number;
  transfers: number;
}

export interface StationDetail extends StationRef {
  commercialName: string | null;
  latitude: number | null;
  longitude: number | null;
  stationType: string | null;
  interchange: boolean;
  status: string | null;
  openingTime: string | null;
  closingTime: string | null;
  lines: LineRef[];
  firstTrain: string | null;
  lastTrain: string | null;
  /** Per-day first/last train per travel direction. */
  dayTimings: DayTiming[];
  adjacent: {
    code: string;
    name: string;
    lineCode: string;
    timeMin: number;
    distanceKm: number;
  }[];
  facilities: StationFacilities;
}

export type DayGroup = "weekdays" | "saturday" | "sunday";

export interface DayTiming {
  dayGroup: DayGroup;
  towardsCode: string | null;
  towardsName: string | null;
  firstTrainTime: string | null;
  lastTrainTime: string | null;
}

export interface StationFacilities {
  description: string | null;
  mobile: string | null;
  landline: string | null;
  amenities: string[];
  gates: { name: string; location: string | null; divyangFriendly: boolean; status: string | null }[];
  lifts: { type: string; name: string; location: string | null; availableOutsideInside: string | null }[];
  parking: { provider: string | null; location: string | null; car: number | null; motorcycle: number | null; cycle: number | null }[];
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function searchStations(q: string): Promise<StationRef[]> {
  return getJson(`/api/stations${q ? `?q=${encodeURIComponent(q)}` : ""}`);
}

export async function fetchLines(): Promise<LineRef[]> {
  return getJson("/api/lines");
}

export async function fetchLineStations(code: string): Promise<LineStation[]> {
  return getJson(`/api/line/${code}`);
}

export interface LineStation extends StationRef {
  interchange: boolean;
  stationType: string | null;
  /** Other lines serving this station (excludes the line being viewed). */
  otherLines: LineRef[];
}

export async function fetchStation(code: string): Promise<StationDetail> {
  return getJson(`/api/station/${code}`);
}

export async function planRoute(from: string, to: string): Promise<RouteResult> {
  const res = await fetch("/api/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to find route");
  }
  return res.json() as Promise<RouteResult>;
}

export async function fetchStatus(): Promise<{
  lastSync: number;
  stations: number;
  edges: number;
  lines: number;
}> {
  return getJson("/api/status");
}

export interface NetworkStation extends StationRef {
  lat: number | null;
  lng: number | null;
  x: number | null;
  y: number | null;
  interchange: boolean;
  /** All line codes serving this station. */
  lines: string[];
}

export interface NetworkLine {
  code: string;
  name: string;
  color: string;
  stations: NetworkStation[];
}

export async function fetchNetwork(): Promise<{ lines: NetworkLine[] }> {
  return getJson("/api/network");
}
