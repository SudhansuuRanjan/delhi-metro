import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchLines,
  fetchLineStations,
  fetchNetwork,
  fetchStation,
  fetchStatus,
  planRoute,
  searchStations,
  type RoutePreference,
} from "./api";

declare global {
  interface WebMCPToolDefinition {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
    execute: (args: Record<string, unknown>) => unknown | Promise<unknown>;
  }
  interface Navigator {
    modelContext?: {
      registerTool: (tool: WebMCPToolDefinition) => void;
      unregisterTool: (name: string) => void;
    };
  }
}

const PREF_VALUES = ["time", "distance", "stations", "fare", "transfers"] as const;

function ok(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

function err(text: string) {
  return { content: [{ type: "text", text }], isError: true };
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/** Accept a station code or (partial) name and resolve it to a code. */
async function resolveStationCode(input: string): Promise<{ code: string; name: string } | null> {
  const q = input.trim();
  if (!q) return null;
  const all = await searchStations("");
  const upper = q.toUpperCase();
  const byCode = all.find((s) => s.code.toUpperCase() === upper);
  if (byCode) return byCode;
  const lower = q.toLowerCase();
  const byName = all.find((s) => s.name.toLowerCase() === lower);
  if (byName) return byName;
  const partial = all.filter((s) => s.name.toLowerCase().includes(lower));
  if (partial.length === 1) return partial[0];
  if (partial.length > 1) {
    const names = partial.slice(0, 10).map((s) => `${s.name} (${s.code})`).join("; ");
    throw new Error(`"${q}" matches multiple stations: ${names}. Ask the user to pick one.`);
  }
  return null;
}

export default function WebMCPTools() {
  const navigate = useNavigate();

  useEffect(() => {
    const mc = navigator.modelContext;
    if (!mc) return;
    const names: string[] = [];
    const register = (tool: WebMCPToolDefinition) => {
      try {
        mc.registerTool(tool);
        names.push(tool.name);
      } catch {
        // WebMCP is progressive enhancement; never break the app.
      }
    };

    register({
      name: "search_stations",
      description:
        "Search Delhi Metro stations by name. Use to find a station code before planning a route or opening station details.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Full or partial station name, e.g. 'Rajiv Chowk' or 'Huda'.",
          },
        },
        required: ["query"],
      },
      execute: async (args) => {
        const query = str(args.query);
        if (!query) return err("Provide a station name query.");
        const results = await searchStations(query);
        return ok({ stations: results.slice(0, 25) });
      },
    });

    register({
      name: "list_metro_lines",
      description: "List all Delhi Metro lines with their codes, names and colors.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => ok({ lines: await fetchLines() }),
    });

    register({
      name: "plan_metro_route",
      description:
        "Plan a Delhi Metro journey between two stations. Accepts station codes or names. Updates the planner UI with the result.",
      inputSchema: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "Origin station code or name, e.g. 'HCC' or 'Millennium City Centre Gurugram'.",
          },
          to: {
            type: "string",
            description: "Destination station code or name.",
          },
          pref: {
            type: "string",
            enum: [...PREF_VALUES],
            description:
              "Route preference: time (fastest), distance (shortest km), stations (fewest stops), fare (cheapest), transfers (fewest interchanges). Defaults to time.",
          },
        },
        required: ["from", "to"],
      },
      execute: async (args) => {
        try {
          const fromRaw = str(args.from);
          const toRaw = str(args.to);
          const prefRaw = str(args.pref) || "time";
          if (!fromRaw || !toRaw) return err("Provide both from and to stations.");
          if (!PREF_VALUES.includes(prefRaw as RoutePreference)) {
            return err(`Unknown preference "${prefRaw}". Use one of: ${PREF_VALUES.join(", ")}.`);
          }
          const from = await resolveStationCode(fromRaw);
          const to = await resolveStationCode(toRaw);
          if (!from) return err(`Origin station "${fromRaw}" not found. Use search_stations to find it.`);
          if (!to) return err(`Destination station "${toRaw}" not found. Use search_stations to find it.`);
          const result = await planRoute(from.code, to.code, prefRaw as RoutePreference);
          navigate(`/?from=${encodeURIComponent(from.code)}&to=${encodeURIComponent(to.code)}`);
          return ok(result);
        } catch (e) {
          return err(e instanceof Error ? e.message : "Failed to plan route.");
        }
      },
    });

    register({
      name: "get_station_details",
      description:
        "Get full details for a Delhi Metro station: lines, first/last train timings (weekday/Saturday/Sunday), gates, lifts, parking, amenities, contacts and nearby stations. Opens the station page in the UI.",
      inputSchema: {
        type: "object",
        properties: {
          station: {
            type: "string",
            description: "Station code or name, e.g. 'HCC' or 'Hindon River'.",
          },
        },
        required: ["station"],
      },
      execute: async (args) => {
        try {
          const resolved = await resolveStationCode(str(args.station));
          if (!resolved) return err(`Station "${str(args.station)}" not found. Use search_stations to find it.`);
          const detail = await fetchStation(resolved.code);
          navigate(`/station/${encodeURIComponent(resolved.code)}`);
          return ok(detail);
        } catch (e) {
          return err(e instanceof Error ? e.message : "Failed to load station.");
        }
      },
    });

    register({
      name: "get_line_stations",
      description:
        "List all stations on a Delhi Metro line in order, flagging interchanges. Opens the line page in the UI.",
      inputSchema: {
        type: "object",
        properties: {
          line: {
            type: "string",
            description: "Line code or name, e.g. 'YL' or 'Yellow Line'.",
          },
        },
        required: ["line"],
      },
      execute: async (args) => {
        const q = str(args.line);
        if (!q) return err("Provide a line code or name.");
        const lines = await fetchLines();
        const upper = q.toUpperCase();
        const match =
          lines.find((l) => l.code.toUpperCase() === upper) ??
          lines.find((l) => l.name.toLowerCase() === q.toLowerCase()) ??
          lines.find((l) => l.name.toLowerCase().includes(q.toLowerCase()));
        if (!match) return err(`Line "${q}" not found. Use list_metro_lines to see valid lines.`);
        const stations = await fetchLineStations(match.code);
        navigate(`/line/${encodeURIComponent(match.code)}`);
        return ok({ line: match, stations });
      },
    });

    register({
      name: "show_network_map",
      description:
        "Open the full Delhi Metro network map in the UI and return a summary: line station counts, total stations and interchange stations.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => {
        const { lines } = await fetchNetwork();
        const seen = new Map<string, { name: string; lines: string[]; interchange: boolean }>();
        for (const l of lines) {
          for (const s of l.stations) {
            const cur = seen.get(s.code);
            if (!cur) seen.set(s.code, { name: s.name, lines: [...s.lines], interchange: s.interchange });
            else {
              cur.lines = [...new Set([...cur.lines, ...s.lines])];
              cur.interchange = cur.interchange || s.interchange;
            }
          }
        }
        const interchanges = [...seen.entries()]
          .filter(([, s]) => s.interchange || s.lines.length > 1)
          .map(([code, s]) => ({ code, ...s }));
        navigate("/map");
        return ok({
          lines: lines.map((l) => ({ code: l.code, name: l.name, stations: l.stations.length })),
          totalStations: seen.size,
          interchangeCount: interchanges.length,
          interchanges: interchanges.slice(0, 60),
        });
      },
    });

    register({
      name: "get_network_status",
      description: "Check when the Delhi Metro network data was last refreshed, with station/edge/line counts.",
      inputSchema: { type: "object", properties: {} },
      execute: async () => ok(await fetchStatus()),
    });

    return () => {
      for (const name of names) {
        try {
          mc.unregisterTool(name);
        } catch {
          // ignore
        }
      }
    };
  }, [navigate]);

  return null;
}
