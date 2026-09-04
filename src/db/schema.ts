import { sqliteTable, text, integer, real, primaryKey } from "drizzle-orm/sqlite-core";

export const lines = sqliteTable("lines", {
  lineCode: text("line_code").primaryKey(),
  name: text("name").notNull(),
  lineColor: text("line_color").notNull(),
  primaryColorCode: text("primary_color_code"),
  secondaryColorCode: text("secondary_color_code"),
  startStation: text("start_station"),
  endStation: text("end_station"),
  showInFrontend: integer("show_in_frontend", { mode: "boolean" }).default(true),
  status: text("status"),
  orderIndex: integer("order_index"),
});

export const stations = sqliteTable("stations", {
  stationCode: text("station_code").primaryKey(),
  name: text("name").notNull(),
  commercialName: text("commercial_name"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  xCoords: real("x_coords"),
  yCoords: real("y_coords"),
  stationType: text("station_type"),
  interchange: integer("interchange", { mode: "boolean" }).default(false),
  status: text("status"),
});

export const stationLines = sqliteTable(
  "station_lines",
  {
    stationCode: text("station_code")
      .notNull()
      .references(() => stations.stationCode, { onDelete: "cascade" }),
    lineCode: text("line_code")
      .notNull()
      .references(() => lines.lineCode, { onDelete: "cascade" }),
    orderIndex: integer("order_index"),
  },
  (t) => [primaryKey({ columns: [t.stationCode, t.lineCode] })]
);

export const edges = sqliteTable(
  "edges",
  {
    fromCode: text("from_code")
      .notNull()
      .references(() => stations.stationCode, { onDelete: "cascade" }),
    toCode: text("to_code")
      .notNull()
      .references(() => stations.stationCode, { onDelete: "cascade" }),
    lineCode: text("line_code")
      .notNull()
      .references(() => lines.lineCode, { onDelete: "cascade" }),
    timeMin: real("time_min").notNull(),
    distanceKm: real("distance_km").notNull(),
    /** "up" = towards the line's start terminal, "down" = towards its end. */
    direction: text("direction").notNull().default("down"),
  },
  (t) => [primaryKey({ columns: [t.fromCode, t.toCode, t.lineCode] })]
);

export const fareBrackets = sqliteTable("fare_brackets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  maxDistanceKm: real("max_distance_km").notNull(),
  fare: integer("fare").notNull(),
});

export const stationTimings = sqliteTable("station_timings", {
  stationCode: text("station_code")
    .primaryKey()
    .references(() => stations.stationCode, { onDelete: "cascade" }),
  firstTrain: text("first_train"),
  lastTrain: text("last_train"),
});

/**
 * Platform number per station + line + direction, derived from the DMRC
 * route API. DMRC uses "up"/"down" directions with a platform per direction,
 * so a station on one line can have two entries (e.g. Platform 1 vs 2).
 */
export const stationPlatforms = sqliteTable(
  "station_platforms",
  {
    stationCode: text("station_code")
      .notNull()
      .references(() => stations.stationCode, { onDelete: "cascade" }),
    lineCode: text("line_code")
      .notNull()
      .references(() => lines.lineCode, { onDelete: "cascade" }),
    direction: text("direction").notNull(), // "up" | "down"
    platformNo: integer("platform_no").notNull(),
  },
  (t) => [primaryKey({ columns: [t.stationCode, t.lineCode, t.direction] })]
);

/**
 * Rich station metadata synced from the DMRC station detail endpoint:
 * description, contact numbers, amenity flags, gates, lifts, and parking.
 */
export const stationFacilities = sqliteTable(
  "station_facilities",
  {
    stationCode: text("station_code")
      .primaryKey()
      .references(() => stations.stationCode, { onDelete: "cascade" }),
    description: text("description"),
    mobile: text("mobile"),
    landline: text("landline"),
    /** JSON array of { name } amenity flags. */
    amenities: text("amenities"),
    /** JSON array of gates { name, location, divyangFriendly, status }. */
    gates: text("gates"),
    /** JSON array of lifts { type, name, location, availableOutsideInside }. */
    lifts: text("lifts"),
    /** JSON array of parking { provider, location, car, motorcycle, cycle }. */
    parking: text("parking"),
  },
  (t) => [primaryKey({ columns: [t.stationCode] })]
);

export const syncMeta = sqliteTable("sync_meta", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: integer("updated_at").notNull(),
});
