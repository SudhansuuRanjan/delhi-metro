// Types mirroring the DMRC backend API responses (verified live).

export interface DmrcLine {
  id: number;
  name: string;
  line_color: string;
  line_code: string;
  primary_color_code: string | null;
  secondary_color_code: string | null;
  class_primary: string | null;
  class_secondary: string | null;
  start_station: string | null;
  end_station: string | null;
  show_in_frontend: boolean | null;
  status: string | null;
}

export interface DmrcStationRef {
  id: number;
  station_name: string;
  station_code: string;
}

export interface DmrcLineDetail extends DmrcLine {
  distance: number | null;
  fare: number | null;
  special_fare: number | null;
  time_travel: number | null;
  station_count: number | null;
  note: string | null;
  first_station: DmrcStationRef | null;
  last_station: DmrcStationRef | null;
  junction: number | null;
}

export interface DmrcStationByLine {
  id: number;
  station_name: string;
  station_code: string;
  station_facility: { name: string; class_name: string; image: { title: string; file: string } }[];
  interchange: boolean;
  status: string;
}

export interface DmrcPrevNextEntry {
  line_id: number;
  prev_station: DmrcStationRef | "";
  next_station: DmrcStationRef | "";
  line_color: string;
  primary_color_code: string;
  secondary_color_code: string | null;
  class_primary: string | null;
  class_secondary: string | null;
}

export interface DmrcTrainTiming {
  first_train?: string | null;
  last_train?: string | null;
  [key: string]: unknown;
}

/** A platform at a station, with the terminal its trains run towards. */
export interface DmrcPlatform {
  platform_name: string | null;
  platform_code?: string | null;
  train_towards?: {
    id?: number;
    station_name?: string | null;
    station_code?: string | null;
  } | null;
  train_towards_second?: {
    id?: number;
    station_name?: string | null;
    station_code?: string | null;
  } | null;
}

/** Top-level amenity flags, e.g. "Divyang Friendly Station". */
export interface DmrcStationFacility {
  name: string;
  class_name: string;
  image: { title: string; file: string };
}

/** A station gate with accessibility + status. */
export interface DmrcGate {
  gate_name: string;
  gate_code: string;
  location: string | null;
  gate_latitude?: string | number | null;
  gate_longitude?: string | number | null;
  divyang_friendly: boolean | null;
  status: string | null;
}

/** Lift / escalator entry. */
export interface DmrcLift {
  lift_type: string;
  name: string;
  description_location: string | null;
  code: string;
  from_gate_code?: string[];
  to_gate_code?: string[];
  from_platform_code?: string[];
  to_platform_code?: string[];
  available_outside_inside?: string | null;
  divyang_friendly: boolean | null;
  status: boolean | null;
  note?: string | null;
}

/** Parking lot with capacities. */
export interface DmrcParking {
  provider: string | null;
  capacity_car: number | null;
  capacity_motorcycle: number | null;
  capacity_cycle: number | null;
  parking_code: string | null;
  nearest_gate_code?: string[];
  location: string | null;
}

/** A named facility inside the station (shop, ATM, toilet...). */
export interface DmrcStationFacilityDetail {
  facility_name: string;
  purpose: string | null;
  location_description: string | null;
  nearest_gate_name?: string;
  nearest_gate_code?: string;
  nearest_platform_name?: string;
  nearest_platform_code?: string;
  nearest_lift_name?: string;
  nearest_lift_code?: string;
}

export interface DmrcStationFacilitiesGroup {
  kind: string;
  "icon-class"?: string;
  detail_list: DmrcStationFacilityDetail[];
}

export interface DmrcStationDetail {
  id: number;
  station_code: string;
  station_name: string;
  station_commercial_name: string | null;
  station_type: string | null;
  interchange: boolean | null;
  latitude: number | null;
  longitude: number | null;
  x_coords: number | null;
  y_coords: number | null;
  status: string | null;
  station_status: unknown[];
  metro_lines: DmrcLine[];
  prev_next_stations: Record<string, DmrcPrevNextEntry[]>[];
  station_facility: DmrcStationFacility[];
  first_last_train: DmrcTrainTiming[] | null;
  /** Platform list with the terminal each platform serves. */
  platforms?: DmrcPlatform[] | null;
  station_description?: string | null;
  mobile?: string | null;
  landline?: string | null;
  gates?: DmrcGate[] | null;
  lifts?: DmrcLift[] | null;
  parkings?: DmrcParking[] | null;
  stations_facilities?: DmrcStationFacilitiesGroup[] | null;
  feeder?: unknown[] | null;
  nearby_places?: unknown[] | null;
}

export interface DmrcRoutePathPoint {
  name: string;
  status?: string | null;
}

export interface DmrcRouteLeg {
  line: string;
  line_no: number | null;
  path: DmrcRoutePathPoint[];
  path_time: string | null;
  "map-path": string[] | null;
  station_interchange_time: number | null;
  start: string;
  end: string;
  /** Present on the station_route endpoint (not new_fare_with_route). */
  direction?: "up" | "down" | null;
  towards_station?: string | null;
  platform_name?: string | null;
}

export interface DmrcStationRoute {
  stations: number;
  from: string;
  to: string;
  total_time: string;
  route: DmrcRouteLeg[];
}

export interface DmrcFareRoute {
  stations: number;
  from: string;
  to: string;
  total_time: string;
  weekday_fare: number;
  weekend_fare: number;
  route: DmrcRouteLeg[];
}
