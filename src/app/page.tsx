"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

interface SavedRoute {
  from: StationId;
  to: StationId;
  fromName: string;
  toName: string;
  timestamp: number;
}

const stationOptions = STATIONS.map((s) => ({
  value: s.id,
  label: s.name,
}));

const getStationName = (id: StationId): string => {
  return STATIONS.find((s) => s.id === id)?.name || id;
};

// LocalStorage keys
const RECENT_SEARCHES_KEY = "delhiMetro_recentSearches";
const FAVORITES_KEY = "delhiMetro_favorites";

// LocalStorage helpers
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

function MetroPlanner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial values from URL
  const urlFrom = searchParams.get("from") as StationId | null;
  const urlTo = searchParams.get("to") as StationId | null;

  const [from, setFrom] = useState<StationId | "">(urlFrom || "");
  const [to, setTo] = useState<StationId | "">(urlTo || "");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RouteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Recent searches & favorites
  const [recentSearches, setRecentSearches] = useState<SavedRoute[]>([]);
  const [favorites, setFavorites] = useState<SavedRoute[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setRecentSearches(getFromStorage<SavedRoute[]>(RECENT_SEARCHES_KEY, []));
    setFavorites(getFromStorage<SavedRoute[]>(FAVORITES_KEY, []));
  }, []);

  // Update URL when from/to change
  const updateUrl = useCallback(
    (newFrom: string, newTo: string) => {
      const params = new URLSearchParams();
      if (newFrom) params.set("from", newFrom);
      if (newTo) params.set("to", newTo);
      const newUrl = params.toString() ? `?${params.toString()}` : "/";
      router.replace(newUrl, { scroll: false });
    },
    [router]
  );

  // Sync from state to URL
  useEffect(() => {
    updateUrl(from, to);
  }, [from, to, updateUrl]);

  // Prevent same source and destination
  useEffect(() => {
    if (from && to && from === to) {
      setTo("");
    }
  }, [from, to]);

  // Auto-search if URL has valid params on mount
  useEffect(() => {
    if (urlFrom && urlTo && urlFrom !== urlTo) {
      const fromExists = STATIONS.some((s) => s.id === urlFrom);
      const toExists = STATIONS.some((s) => s.id === urlTo);
      if (fromExists && toExists) {
        handleSearch(urlFrom, urlTo);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap stations
  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  // Add to recent searches
  const addToRecentSearches = (fromId: StationId, toId: StationId) => {
    const newSearch: SavedRoute = {
      from: fromId,
      to: toId,
      fromName: getStationName(fromId),
      toName: getStationName(toId),
      timestamp: Date.now(),
    };

    const filtered = recentSearches.filter(
      (s) => !(s.from === fromId && s.to === toId)
    );
    const updated = [newSearch, ...filtered].slice(0, 5);
    setRecentSearches(updated);
    saveToStorage(RECENT_SEARCHES_KEY, updated);
  };

  // Toggle favorite
  const toggleFavorite = (fromId: StationId, toId: StationId) => {
    const exists = favorites.some((f) => f.from === fromId && f.to === toId);
    let updated: SavedRoute[];

    if (exists) {
      updated = favorites.filter((f) => !(f.from === fromId && f.to === toId));
    } else {
      const newFav: SavedRoute = {
        from: fromId,
        to: toId,
        fromName: getStationName(fromId),
        toName: getStationName(toId),
        timestamp: Date.now(),
      };
      updated = [newFav, ...favorites];
    }

    setFavorites(updated);
    saveToStorage(FAVORITES_KEY, updated);
  };

  // Check if current route is a favorite
  const isFavorite =
    from && to && favorites.some((f) => f.from === from && f.to === to);

  // Search function
  const handleSearch = async (fromId: StationId, toId: StationId) => {
    setError(null);
    setData(null);
    setLoading(true);

    try {
      const res = await fetch("/api/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromId, to: toId }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to get route.");
      } else {
        setData(json);
        addToRecentSearches(fromId, toId);
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  async function handlePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) {
      setError("Please select both source and destination.");
      return;
    }
    if (from === to) {
      setError("Source and destination cannot be the same.");
      return;
    }
    handleSearch(from as StationId, to as StationId);
  }

  // Copy share link
  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  // Load saved route
  const loadRoute = (route: SavedRoute) => {
    setFrom(route.from);
    setTo(route.to);
    setShowRecent(false);
    setShowFavorites(false);
  };

  return (
    <main className="min-h-screen text-white relative z-10">
      <div className="max-w-4xl mx-auto px-4 pb-16">
        {/* Header */}
        <header className="app-header">
          <div className="metro-icon">🚇</div>
          <h1 className="app-title">Delhi Metro</h1>
          <p className="app-subtitle">Smart Route Planner</p>
        </header>

        {/* Quick Access Buttons */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              setShowRecent(!showRecent);
              setShowFavorites(false);
            }}
            className={`quick-access-btn ${showRecent ? "active" : ""}`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Recent
          </button>
          <button
            type="button"
            onClick={() => {
              setShowFavorites(!showFavorites);
              setShowRecent(false);
            }}
            className={`quick-access-btn ${showFavorites ? "active" : ""}`}
          >
            <svg
              className="w-4 h-4"
              fill={showFavorites ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            Favorites
          </button>
        </div>

        {/* Recent Searches Dropdown */}
        {showRecent && (
          <div className="glass-card p-4 mb-6 fade-in">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">
              Recent Searches
            </h3>
            {recentSearches.length === 0 ? (
              <p className="text-slate-500 text-sm">No recent searches yet</p>
            ) : (
              <div className="space-y-2">
                {recentSearches.map((route, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadRoute(route)}
                    className="saved-route-item w-full"
                  >
                    <span className="truncate">{route.fromName}</span>
                    <svg
                      className="w-4 h-4 flex-shrink-0 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                    <span className="truncate">{route.toName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorites Dropdown */}
        {showFavorites && (
          <div className="glass-card p-4 mb-6 fade-in">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">
              Favorite Routes
            </h3>
            {favorites.length === 0 ? (
              <p className="text-slate-500 text-sm">
                No favorites yet. Search a route and tap ❤️ to save!
              </p>
            ) : (
              <div className="space-y-2">
                {favorites.map((route, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      onClick={() => loadRoute(route)}
                      className="saved-route-item flex-1"
                    >
                      <span className="truncate">{route.fromName}</span>
                      <svg
                        className="w-4 h-4 flex-shrink-0 text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                      <span className="truncate">{route.toName}</span>
                    </button>
                    <button
                      onClick={() => toggleFavorite(route.from, route.to)}
                      className="p-2 text-rose-400 hover:text-rose-300 transition-colors"
                      title="Remove from favorites"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handlePlan} className="glass-card p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* FROM */}
            <div className="select-wrapper flex-1 w-full">
              <label className="block text-sm font-medium text-slate-400 mb-2 tracking-wide">
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    <path
                      strokeWidth="2"
                      d="M12 2v4m0 12v4m10-10h-4M6 12H2"
                    />
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
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
              />
            </div>

            {/* SWAP BUTTON */}
            <button
              type="button"
              onClick={handleSwap}
              className="swap-btn hidden md:flex mx-auto"
              title="Swap origin and destination"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </button>

            {/* TO */}
            <div className="select-wrapper flex-1 w-full">
              <label className="block text-sm font-medium text-slate-400 mb-2 tracking-wide">
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
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
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
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
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
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
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
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

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(data.from.id, data.to.id)}
                    className={`action-btn ${
                      isFavorite ? "text-rose-400" : "text-slate-400"
                    }`}
                    title={
                      isFavorite ? "Remove from favorites" : "Add to favorites"
                    }
                  >
                    <svg
                      className="w-5 h-5"
                      fill={isFavorite ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="action-btn text-slate-400"
                    title="Copy share link"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="stat-item">
                  <span className="stat-value">{data.route.totalTimeMin}</span>
                  <span className="stat-label">Minutes</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {data.route.totalDistanceKm.toFixed(1)}
                  </span>
                  <span className="stat-label">Kilometers</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">₹{data.route.fareEstimate}</span>
                  <span className="stat-label">Fare</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{data.route.transfers}</span>
                  <span className="stat-label">
                    {data.route.transfers === 1 ? "Transfer" : "Transfers"}
                  </span>
                </div>
              </div>
            </div>

            {/* Segments */}
            <div className="route-timeline">
              {data.route.segments.map((seg, idx) => (
                <div
                  key={idx}
                  className="fade-in"
                  style={{ animationDelay: `${0.2 + idx * 0.15}s` }}
                >
                  {/* Transfer indicator */}
                  {idx > 0 && (
                    <div className="transfer-badge ml-4 mb-4">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                        />
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
                        borderBottom: `2px solid ${seg.color}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="line-badge"
                          style={{
                            backgroundColor: `${seg.color}25`,
                            color: seg.color,
                            border: `1px solid ${seg.color}40`,
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
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <circle cx="12" cy="12" r="9" strokeWidth="2" />
                            <path strokeWidth="2" d="M12 6v6l4 2" />
                          </svg>
                          {seg.timeMin} min
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeWidth="2"
                              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                            />
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
                                  boxShadow:
                                    i === 0 || i === seg.stations.length - 1
                                      ? `0 0 12px ${seg.color}60, 0 0 0 4px ${seg.color}33`
                                      : `0 0 0 4px ${seg.color}33`,
                                }}
                              />
                              {i < seg.stations.length - 1 && (
                                <div className="flex flex-col items-center">
                                  <div
                                    className="w-0.5 h-2 mt-1"
                                    style={{
                                      backgroundColor: `${seg.color}50`,
                                    }}
                                  />
                                  <svg
                                    className="w-2.5 h-2.5 -my-0.5"
                                    viewBox="0 0 10 10"
                                    fill={seg.color}
                                  >
                                    <path
                                      d="M5 0 L10 5 L7 5 L7 10 L3 10 L3 5 L0 5 Z"
                                      transform="rotate(180 5 5)"
                                    />
                                  </svg>
                                  <div
                                    className="w-0.5 h-2"
                                    style={{
                                      backgroundColor: `${seg.color}50`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                            <span
                              className={`text-sm ${
                                i === 0 || i === seg.stations.length - 1
                                  ? "font-semibold text-white"
                                  : "text-slate-400"
                              }`}
                            >
                              {st.name}
                              {i === 0 && idx === 0 && (
                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Board here
                                </span>
                              )}
                              {i === seg.stations.length - 1 &&
                                idx === data.route.segments.length - 1 && (
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
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
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
                        color:
                          data.route.segments.find((s) => s.line === f.line)
                            ?.color || "#fff",
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Loading planner...</div>}>
      <MetroPlanner />
    </Suspense>
  );
}

/* ------------------ */
/* Select styles */
/* ------------------ */

const selectStyles = {
  control: (base: Record<string, unknown>, state: { isFocused: boolean }) => ({
    ...base,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderColor: state.isFocused
      ? "rgba(16, 185, 129, 0.6)"
      : "rgba(255, 255, 255, 0.1)",
    borderRadius: "14px",
    padding: "4px 8px",
    boxShadow: state.isFocused
      ? "0 0 0 2px rgba(16, 185, 129, 0.2), 0 4px 20px rgba(0, 0, 0, 0.3)"
      : "0 4px 20px rgba(0, 0, 0, 0.2)",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease",
    ":hover": {
      borderColor: "rgba(16, 185, 129, 0.4)",
    },
  }),

  menu: (base: Record<string, unknown>) => ({
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

  menuPortal: (base: Record<string, unknown>) => ({
    ...base,
    zIndex: 9999,
  }),

  menuList: (base: Record<string, unknown>) => ({
    ...base,
    padding: "8px",
  }),

  option: (
    base: Record<string, unknown>,
    state: { isSelected: boolean; isFocused: boolean }
  ) => ({
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

  singleValue: (base: Record<string, unknown>) => ({
    ...base,
    color: "#ffffff",
    fontWeight: 500,
  }),

  input: (base: Record<string, unknown>) => ({
    ...base,
    color: "#ffffff",
  }),

  placeholder: (base: Record<string, unknown>) => ({
    ...base,
    color: "#64748b",
  }),

  dropdownIndicator: (base: Record<string, unknown>) => ({
    ...base,
    color: "#94a3b8",
    transition: "all 0.2s ease",
    ":hover": { color: "#10b981", transform: "scale(1.1)" },
  }),

  clearIndicator: (base: Record<string, unknown>) => ({
    ...base,
    color: "#94a3b8",
    transition: "all 0.2s ease",
    ":hover": { color: "#ef4444", transform: "scale(1.1)" },
  }),

  indicatorSeparator: () => ({
    display: "none",
  }),
};
