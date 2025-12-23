"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import { STATIONS, type StationId } from "@/data/stations";

interface RouteResponse {
  from: { id: StationId; name: string };
  to: { id: StationId; name: string };
  route: {
    segments: {
      line: string;
      color: string;
      stations: { id: StationId; name: string }[];
      timeMin: number;
      distanceKm: number;
    }[];
    totalTimeMin: number;
    totalDistanceKm: number;
    fareEstimate: number;
    transfers: number;
  };
  frequencies: {
    line: string;
    frequency: {
      peak: string;
      offPeak: string;
      night: string;
    };
  }[];
}

const stationOptions = STATIONS.map((s) => ({
  value: s.id,
  label: s.name,
}));

export default function HomePage() {
  const [from, setFrom] = useState<StationId | "">("");
  const [to, setTo] = useState<StationId | "">("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RouteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prevent same source and destination
  useEffect(() => {
    if (from && to && from === to) {
      setTo("");
    }
  }, [from, to]);

  async function handlePlan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);

    if (!from || !to) {
      setError("Please select both source and destination.");
      return;
    }

    if (from === to) {
      setError("Source and destination cannot be the same.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to get route.");
      } else {
        setData(json);
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">

        {/* Header */}
        <header>
          <h1 className="text-3xl font-bold">Delhi Metro Route Planner</h1>
          <p className="text-sm text-slate-400">
            Static planner • coloured lines • intermediate stations
          </p>
        </header>

        {/* Search Form */}
        <form
          onSubmit={handlePlan}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* FROM */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Source
              </label>
              <Select
                instanceId="from-station-select"
                options={stationOptions}
                placeholder="Search station..."
                isClearable
                value={stationOptions.find((o) => o.value === from) || null}
                onChange={(opt) => setFrom(opt ? opt.value : "")}
                styles={selectStyles}
              />

            </div>

            {/* TO */}
            <div>
              <label className="text-xs text-slate-400 mb-1 block">
                Destination
              </label>
              <Select
                instanceId="to-station-select"
                options={stationOptions.filter((o) => o.value !== from)}
                placeholder="Search station..."
                isClearable
                value={stationOptions.find((o) => o.value === to) || null}
                onChange={(opt) => setTo(opt ? opt.value : "")}
                styles={selectStyles}
              />

            </div>

          </div>

          <button
            disabled={loading}
            className="w-full md:w-auto rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 font-semibold text-sm disabled:opacity-60"
          >
            {loading ? "Planning…" : "Plan Route"}
          </button>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </form>

        {/* Route Result */}
        {data && (
          <section className="space-y-4">
            {/* Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h2 className="font-semibold text-lg">
                {data.from.name} → {data.to.name}
              </h2>
              <p className="text-sm text-slate-300">
                ~{data.route.totalTimeMin} min •{" "}
                {data.route.totalDistanceKm.toFixed(1)} km • ₹
                {data.route.fareEstimate} • Transfers:{" "}
                {data.route.transfers}
              </p>
            </div>

            {/* Segments */}
            {data.route.segments.map((seg, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                <div
                  className="px-4 py-2 flex justify-between items-center"
                  style={{ borderBottom: `2px solid ${seg.color}` }}
                >
                  <span className="font-semibold">
                    {seg.line} Line
                  </span>
                  <span className="text-xs text-slate-400">
                    ~{seg.timeMin} min • {seg.distanceKm.toFixed(1)} km
                  </span>
                </div>

                <ol className="px-4 py-3 space-y-1 text-sm">
                  {seg.stations.map((st, i) => (
                    <li key={st.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: seg.color }}
                        />
                        {i < seg.stations.length - 1 && (
                          <span
                            style={{ color: seg.color }}
                            className="text-xs leading-none"
                          >
                            ↓
                          </span>
                        )}
                      </div>

                      <span>{st.name}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}

            {/* Frequency */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-2">
                Standard Train Frequency
              </h3>
              {data.frequencies.map((f) => (
                <div key={f.line} className="text-sm text-slate-300">
                  <strong>{f.line}</strong>: Peak {f.frequency.peak}, Off-peak{" "}
                  {f.frequency.offPeak}, Night {f.frequency.night}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* ------------------ */
/* Select styles */
/* ------------------ */

const selectStyles = {
  control: (base: any, state: any) => ({
    ...base,
    backgroundColor: "#020617",          // slate-950
    borderColor: state.isFocused ? "#22c55e" : "#334155",
    boxShadow: state.isFocused ? "0 0 0 1px #22c55e" : "none",
    ":hover": {
      borderColor: "#22c55e",
    },
  }),

  menu: (base: any) => ({
    ...base,
    backgroundColor: "#020617",
    border: "1px solid #334155",
    zIndex: 50,
  }),

  menuList: (base: any) => ({
    ...base,
    padding: 0,
  }),

  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "#064e3b"                         // emerald-900
      : state.isFocused
        ? "#022c22"                         // emerald-950-ish
        : "#020617",
    color: "#e5e7eb",
    cursor: "pointer",
    ":active": {
      backgroundColor: "#065f46",         // emerald-800
    },
  }),

  singleValue: (base: any) => ({
    ...base,
    color: "#e5e7eb",
  }),

  input: (base: any) => ({
    ...base,
    color: "#e5e7eb",
  }),

  placeholder: (base: any) => ({
    ...base,
    color: "#64748b",                     // slate-500
  }),

  dropdownIndicator: (base: any) => ({
    ...base,
    color: "#94a3b8",
    ":hover": { color: "#22c55e" },
  }),

  clearIndicator: (base: any) => ({
    ...base,
    color: "#94a3b8",
    ":hover": { color: "#ef4444" },
  })
};
