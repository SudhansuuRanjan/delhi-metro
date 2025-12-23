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
    <main className="min-h-screen text-white relative z-10">
      <div className="max-w-4xl mx-auto px-4 pb-16">

        {/* Header */}
        <header className="app-header">
          <div className="metro-icon">🚇</div>
          <h1 className="app-title">Delhi Metro</h1>
          <p className="app-subtitle">
            Smart Route Planner
          </p>
        </header>

        {/* Search Form */}
        <form
          onSubmit={handlePlan}
          className="glass-card p-6 md:p-8 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* FROM */}
            <div className="select-wrapper">
              <label className="block text-sm font-medium text-slate-400 mb-2 tracking-wide">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    <path strokeWidth="2" d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
                  </svg>
                  Origin Station
                </span>
              </label>
              <Select
                instanceId="from-station-select"
                options={stationOptions}
                placeholder="Where are you starting from?"
                isClearable
                value={stationOptions.find((o) => o.value === from) || null}
                onChange={(opt) => setFrom(opt ? opt.value : "")}
                styles={selectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              />
            </div>

            {/* TO */}
            <div className="select-wrapper">
              <label className="block text-sm font-medium text-slate-400 mb-2 tracking-wide">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <circle cx="12" cy="11" r="2" strokeWidth="2" />
                  </svg>
                  Destination Station
                </span>
              </label>
              <Select
                instanceId="to-station-select"
                options={stationOptions.filter((o) => o.value !== from)}
                placeholder="Where do you want to go?"
                isClearable
                value={stationOptions.find((o) => o.value === to) || null}
                onChange={(opt) => setTo(opt ? opt.value : "")}
                styles={selectStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
              />
            </div>

          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              disabled={loading}
              className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Finding Route...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Plan My Journey
                </>
              )}
            </button>

            {from && to && (
              <span className="text-sm text-slate-500 fade-in">
                Ready to find your optimal route
              </span>
            )}
          </div>

          {error && (
            <div className="error-message fade-in">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </form>

        {/* Route Result */}
        {data && (
          <section className="space-y-6 mt-8 stagger-children">

            {/* Journey Summary */}
            <div className="glass-card p-6 fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    Route Found
                  </h2>
                  <p className="text-sm text-slate-400">
                    {data.from.name} → {data.to.name}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-item">
                  <span className="stat-value">{data.route.totalTimeMin}</span>
                  <span className="stat-label">Minutes</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{data.route.totalDistanceKm.toFixed(1)}</span>
                  <span className="stat-label">Kilometers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">₹{data.route.fareEstimate}</span>
                  <span className="stat-label">Fare</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{data.route.transfers}</span>
                  <span className="stat-label">{data.route.transfers === 1 ? 'Transfer' : 'Transfers'}</span>
                </div>
              </div>
            </div>

            {/* Segments */}
            <div className="route-timeline">
              {data.route.segments.map((seg, idx) => (
                <div key={idx} className="fade-in" style={{ animationDelay: `${0.2 + idx * 0.15}s` }}>

                  {/* Transfer indicator */}
                  {idx > 0 && (
                    <div className="transfer-badge ml-4 mb-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      Change to {seg.line} Line
                    </div>
                  )}

                  <div className="glass-card overflow-hidden">
                    {/* Segment Header */}
                    <div
                      className="px-5 py-4 flex justify-between items-center"
                      style={{
                        background: `linear-gradient(135deg, ${seg.color}15, ${seg.color}08)`,
                        borderBottom: `2px solid ${seg.color}`
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="line-badge"
                          style={{
                            backgroundColor: `${seg.color}25`,
                            color: seg.color,
                            border: `1px solid ${seg.color}40`
                          }}
                        >
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: seg.color }}
                          />
                          {seg.line}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                            <path strokeWidth="2" d="M12 6v6l4 2" />
                          </svg>
                          {seg.timeMin} min
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          {seg.distanceKm.toFixed(1)} km
                        </span>
                      </div>
                    </div>

                    {/* Station List */}
                    <div className="p-4">
                      <ol className="space-y-0">
                        {seg.stations.map((st, i) => (
                          <li
                            key={st.id}
                            className="station-item flex items-start gap-4 py-2"
                            style={{ animationDelay: `${0.05 * i}s` }}
                          >
                            <div className="flex flex-col items-center relative">
                              <span
                                className="w-3 h-3 rounded-full z-10 flex-shrink-0"
                                style={{
                                  backgroundColor: seg.color,
                                  boxShadow: i === 0 || i === seg.stations.length - 1
                                    ? `0 0 12px ${seg.color}60, 0 0 0 4px ${seg.color}33`
                                    : `0 0 0 4px ${seg.color}33`
                                }}
                              />
                              {i < seg.stations.length - 1 && (
                                <div className="flex flex-col items-center">
                                  <div
                                    className="w-0.5 h-2 mt-1"
                                    style={{ backgroundColor: `${seg.color}50` }}
                                  />
                                  <svg
                                    className="w-2.5 h-2.5 -my-0.5"
                                    viewBox="0 0 10 10"
                                    fill={seg.color}
                                  >
                                    <path d="M5 0 L10 5 L7 5 L7 10 L3 10 L3 5 L0 5 Z" transform="rotate(180 5 5)" />
                                  </svg>
                                  <div
                                    className="w-0.5 h-2"
                                    style={{ backgroundColor: `${seg.color}50` }}
                                  />
                                </div>
                              )}
                            </div>
                            <span
                              className={`text-sm ${i === 0 || i === seg.stations.length - 1
                                ? 'font-semibold text-white'
                                : 'text-slate-400'
                                }`}
                            >
                              {st.name}
                              {i === 0 && idx === 0 && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Board here
                                </span>
                              )}
                              {i === seg.stations.length - 1 && idx === data.route.segments.length - 1 && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  Exit here
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Frequency Information */}
            <div className="glass-card p-6 fade-in">
              <h3 className="flex items-center gap-3 font-semibold text-lg mb-4">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth="2" />
                  <path strokeWidth="2" d="M12 6v6l4 2" />
                </svg>
                Train Frequency
              </h3>
              <div className="space-y-2">
                {data.frequencies.map((f) => (
                  <div key={f.line} className="frequency-item">
                    <span
                      className="font-semibold text-sm min-w-[80px]"
                      style={{
                        color: data.route.segments.find(s => s.line === f.line)?.color || '#fff'
                      }}
                    >
                      {f.line}
                    </span>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        Peak: {f.frequency.peak}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                        Off-peak: {f.frequency.offPeak}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        Night: {f.frequency.night}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderColor: state.isFocused ? "rgba(16, 185, 129, 0.6)" : "rgba(255, 255, 255, 0.1)",
    borderRadius: "14px",
    padding: "4px 8px",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(16, 185, 129, 0.2), 0 4px 20px rgba(0, 0, 0, 0.3)" : "0 4px 20px rgba(0, 0, 0, 0.2)",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease",
    ":hover": {
      borderColor: "rgba(16, 185, 129, 0.4)",
    },
  }),

  menu: (base: any) => ({
    ...base,
    backgroundColor: "rgba(10, 10, 26, 0.95)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
    zIndex: 50,
    animation: "fadeIn 0.2s ease",
  }),

  menuPortal: (base: any) => ({
    ...base,
    zIndex: 9999,
  }),

  menuList: (base: any) => ({
    ...base,
    padding: "8px",
  }),

  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isSelected
      ? "rgba(16, 185, 129, 0.25)"
      : state.isFocused
        ? "rgba(255, 255, 255, 0.08)"
        : "transparent",
    color: state.isSelected ? "#10b981" : "#e5e7eb",
    cursor: "pointer",
    borderRadius: "10px",
    padding: "12px 16px",
    margin: "2px 0",
    transition: "all 0.2s ease",
    ":active": {
      backgroundColor: "rgba(16, 185, 129, 0.3)",
    },
  }),

  singleValue: (base: any) => ({
    ...base,
    color: "#ffffff",
    fontWeight: 500,
  }),

  input: (base: any) => ({
    ...base,
    color: "#ffffff",
  }),

  placeholder: (base: any) => ({
    ...base,
    color: "#64748b",
  }),

  dropdownIndicator: (base: any) => ({
    ...base,
    color: "#94a3b8",
    transition: "all 0.2s ease",
    ":hover": { color: "#10b981", transform: "scale(1.1)" },
  }),

  clearIndicator: (base: any) => ({
    ...base,
    color: "#94a3b8",
    transition: "all 0.2s ease",
    ":hover": { color: "#ef4444", transform: "scale(1.1)" },
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),
};
