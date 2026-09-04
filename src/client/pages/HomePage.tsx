import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Select, { type SingleValue } from "react-select";
import {
  ArrowRight,
  ArrowUpDown,
  ArrowUpRight,
  Clock,
  Heart,
  History,
  Link2,
  Map as MapIcon,
  Trash2,
  X,
} from "lucide-react";
import {
  useLines,
  useStations,
  useRouteMutation,
  useSyncStatus,
} from "../hooks";
import type { RouteResult } from "../api";

interface SavedRoute {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  timestamp: number;
}

const RECENT_KEY = "delhiMetro_v2_recentSearches";
const FAV_KEY = "delhiMetro_v2_favorites";

function getFromStorage<T>(key: string, def: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : def;
  } catch {
    return def;
  }
}
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

/** Pick readable text (dark/light) over a hex background color. */
function readableOn(hex: string): string {
  const m = hex.replace("#", "");
  if (m.length !== 6) return "#fff";
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  // Relative luminance (WCAG-ish): brighter backgrounds get dark text.
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0f172a" : "#ffffff";
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  const { data: stations = [] } = useStations();
  const { data: lines = [] } = useLines();
  const { data: status } = useSyncStatus();
  const routeMutation = useRouteMutation();

  const [recent, setRecent] = useState<SavedRoute[]>(() =>
    getFromStorage<SavedRoute[]>(RECENT_KEY, []),
  );
  const [favorites, setFavorites] = useState<SavedRoute[]>(() =>
    getFromStorage<SavedRoute[]>(FAV_KEY, []),
  );
  const [showRecent, setShowRecent] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);

  const stationOptions = useMemo(
    () => stations.map((s) => ({ value: s.code, label: s.name })),
    [stations],
  );
  const nameOf = useMemo(
    () => new Map(stations.map((s) => [s.code, s.name])),
    [stations],
  );

  /** Update the origin/destination in the URL so the selection survives
   *  navigation and browser back/forward. */
  function setPair(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams(searchParams);
    if (nextFrom) params.set("from", nextFrom);
    else params.delete("from");
    if (nextTo) params.set("to", nextTo);
    else params.delete("to");
    setSearchParams(params, { replace: true });
  }

  // Auto-search when URL params change (deep links, back/forward, share links).
  // Reading recent via ref avoids re-triggering when runSearch updates it.
  const recentRef = useRef(recent);
  useEffect(() => {
    recentRef.current = recent;
  }, [recent]);

  useEffect(() => {
    if (from && to && from !== to) {
      runSearch(from, to);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  async function runSearch(fromId: string, toId: string) {
    try {
      const r = await routeMutation.mutateAsync({ from: fromId, to: toId });
      setResult(r);
      const entry: SavedRoute = {
        from: fromId,
        to: toId,
        fromName: nameOf.get(fromId) ?? fromId,
        toName: nameOf.get(toId) ?? toId,
        timestamp: Date.now(),
      };
      const cur = recentRef.current;
      const filtered = cur.filter((s) => !(s.from === fromId && s.to === toId));
      const updated = [entry, ...filtered].slice(0, 5);
      setRecent(updated);
      recentRef.current = updated;
      saveToStorage(RECENT_KEY, updated);
    } catch (err) {
      console.error(err);
    }
  }

  function handlePlan(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) return;
    if (from === to) return;
    runSearch(from, to);
  }

  const removeRecent = (fromId: string, toId: string) => {
    const updated = recentRef.current.filter(
      (s) => !(s.from === fromId && s.to === toId),
    );
    setRecent(updated);
    recentRef.current = updated;
    saveToStorage(RECENT_KEY, updated);
  };

  const clearRecent = () => {
    setRecent([]);
    recentRef.current = [];
    saveToStorage<SavedRoute[]>(RECENT_KEY, []);
  };

  const clearFavorites = () => {
    setFavorites([]);
    saveToStorage<SavedRoute[]>(FAV_KEY, []);
  };

  const toggleFavorite = (fromId: string, toId: string) => {
    const exists = favorites.some((f) => f.from === fromId && f.to === toId);
    let updated: SavedRoute[];
    if (exists) {
      updated = favorites.filter((f) => !(f.from === fromId && f.to === toId));
    } else {
      updated = [
        {
          from: fromId,
          to: toId,
          fromName: nameOf.get(fromId) ?? fromId,
          toName: nameOf.get(toId) ?? toId,
          timestamp: Date.now(),
        },
        ...favorites,
      ];
    }
    setFavorites(updated);
    saveToStorage(FAV_KEY, updated);
  };

  const isFavorite =
    result &&
    favorites.some((f) => f.from === result.from && f.to === result.to);

  const copyShareLink = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const url = `${window.location.origin}/?${params.toString()}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  const selectStyles = {
    control: (
      base: Record<string, unknown>,
      state: { isFocused: boolean },
    ) => ({
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
      ":hover": { borderColor: "rgba(16, 185, 129, 0.4)" },
      fontSize: "0.8rem",
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
      fontSize: "0.8rem",
    }),
    menuPortal: (base: Record<string, unknown>) => ({ ...base, zIndex: 9999 }),
    menuList: (base: Record<string, unknown>) => ({ ...base, padding: "8px" }),
    option: (
      base: Record<string, unknown>,
      state: { isSelected: boolean; isFocused: boolean },
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
      fontSize: "0.8rem",
    }),
    singleValue: (base: Record<string, unknown>) => ({
      ...base,
      color: "#ffffff",
      fontWeight: 500,
    }),
    input: (base: Record<string, unknown>) => ({ ...base, color: "#ffffff" }),
    placeholder: (base: Record<string, unknown>) => ({
      ...base,
      color: "#64748b",
    }),
    dropdownIndicator: (base: Record<string, unknown>) => ({
      ...base,
      color: "#94a3b8",
    }),
    clearIndicator: (base: Record<string, unknown>) => ({
      ...base,
      color: "#94a3b8",
    }),
    indicatorSeparator: () => ({ display: "none" }),
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      {/* Header */}
      <header className="app-header">
        <div className="hero-topline">
          <span className="hero-eyebrow">
            <span className="live-dot" /> Delhi NCR transit guide
          </span>
          <span className="hero-actions">
            <span className="status-pill">
              <span className="live-dot" /> Live network data
            </span>
            <button
              type="button"
              onClick={() => {
                setShowRecent(!showRecent);
                setShowFavorites(false);
              }}
              className={`icon-btn ${showRecent ? "active" : ""}`}
              title={showRecent ? "Hide recent searches" : "Show recent searches"}
              aria-label="Recent searches"
              aria-pressed={showRecent}
            >
              <History size={15} strokeWidth={2.2} />
              {recent.length > 0 && (
                <span className="icon-badge">{recent.length}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowFavorites(!showFavorites);
                setShowRecent(false);
              }}
              className={`icon-btn ${showFavorites ? "active" : ""}`}
              title={showFavorites ? "Hide favorites" : "Show favorites"}
              aria-label="Favorite routes"
              aria-pressed={showFavorites}
            >
              <Heart size={15} strokeWidth={2.2} />
              {favorites.length > 0 && (
                <span className="icon-badge">{favorites.length}</span>
              )}
            </button>
            <Link
              to="/map"
              className="icon-btn"
              title="Open full network map"
              aria-label="Open full network map"
            >
              <MapIcon size={15} strokeWidth={2.2} />
            </Link>
          </span>
        </div>
        <div className="metro-icon">🚇</div>
        <h1 className="app-title">Delhi Metro</h1>
        <p className="app-subtitle">Smart route planning, made simple</p>
        {status && status.lastSync > 0 && (
          <p className="sync-note">
            Network refreshed{" "}
            {Math.max(1, Math.round((Date.now() - status.lastSync) / 3600000))}h
            ago
          </p>
        )}
      </header>

      {/* Lines row */}
      {lines.length > 0 && (
        <div className="lines-directory">
          <div className="section-kicker">
            <span>Explore the network</span>
            <span className="section-rule" />
          </div>
          <div className="lines-strip">
            {lines.map((l) => (
              <Link
                key={l.code}
                to={`/line/${l.code}`}
                className="line-badge"
                style={{
                  backgroundColor: `${l.color}25`,
                  color: l.color,
                  border: `1px solid ${l.color}40`,
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: l.color }}
                />
                {l.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {(showRecent || showFavorites) && (
        <div className="saved-panels">
          {showRecent && (
            <div className="glass-card saved-panel p-4 fade-in">
              <div className="saved-panel-header">
                <h3 className="saved-panel-title">
                  <span className="saved-panel-icon">
                    <History size={14} strokeWidth={2.2} />
                  </span>
                  Recent Searches
                  {recent.length > 0 && (
                    <span className="saved-count">{recent.length}</span>
                  )}
                </h3>
                {recent.length > 0 && (
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="saved-clear-btn"
                    title="Clear recent searches"
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
                    Clear
                  </button>
                )}
              </div>
              {recent.length === 0 ? (
                <p className="saved-empty">
                  <Clock size={15} strokeWidth={2} />
                  No recent searches yet — plan a journey to see it here.
                </p>
              ) : (
                <div className="space-y-2">
                  {recent.map((route) => {
                    const fav = favorites.some(
                      (f) => f.from === route.from && f.to === route.to,
                    );
                    return (
                      <div
                        key={`${route.from}-${route.to}`}
                        className="saved-route-row"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setPair(route.from, route.to);
                            setShowRecent(false);
                          }}
                          className="saved-route-item flex-1"
                          title={`${route.fromName} to ${route.toName}`}
                        >
                          <span className="saved-route-icon">
                            <Clock size={14} strokeWidth={2.2} />
                          </span>
                          <span className="truncate font-medium">
                            {route.fromName}
                          </span>
                          <ArrowRight
                            size={14}
                            strokeWidth={2.2}
                            className="shrink-0 text-emerald-400/80"
                          />
                          <span className="truncate text-slate-300">
                            {route.toName}
                          </span>
                          <ArrowUpRight
                            size={14}
                            strokeWidth={2.2}
                            className="saved-open-icon"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            toggleFavorite(route.from, route.to)
                          }
                          className={`saved-mini-btn ${fav ? "saved-mini-btn-active" : ""}`}
                          title={
                            fav ? "Remove from favorites" : "Add to favorites"
                          }
                          aria-label={
                            fav ? "Remove from favorites" : "Add to favorites"
                          }
                        >
                          <Heart
                            size={14}
                            strokeWidth={2.2}
                            fill={fav ? "currentColor" : "none"}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRecent(route.from, route.to)}
                          className="saved-mini-btn"
                          title="Remove from recent"
                          aria-label="Remove from recent"
                        >
                          <X size={14} strokeWidth={2.2} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {showFavorites && (
            <div className="glass-card saved-panel p-4 fade-in">
              <div className="saved-panel-header">
                <h3 className="saved-panel-title">
                  <span className="saved-panel-icon fav">
                    <Heart size={14} strokeWidth={2.2} />
                  </span>
                  Favorite Routes
                  {favorites.length > 0 && (
                    <span className="saved-count">{favorites.length}</span>
                  )}
                </h3>
                {favorites.length > 0 && (
                  <button
                    type="button"
                    onClick={clearFavorites}
                    className="saved-clear-btn"
                    title="Clear favorites"
                  >
                    <Trash2 size={13} strokeWidth={2.2} />
                    Clear
                  </button>
                )}
              </div>
              {favorites.length === 0 ? (
                <p className="saved-empty">
                  <Heart size={15} strokeWidth={2} />
                  No favorites yet — search a route and tap the heart to save
                  it here.
                </p>
              ) : (
                <div className="space-y-2">
                  {favorites.map((route) => (
                    <div
                      key={`${route.from}-${route.to}`}
                      className="saved-route-row"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setPair(route.from, route.to);
                          setShowFavorites(false);
                        }}
                        className="saved-route-item flex-1"
                        title={`${route.fromName} to ${route.toName}`}
                      >
                        <span className="saved-route-icon fav">
                          <Heart size={14} strokeWidth={2.2} />
                        </span>
                        <span className="truncate font-medium">
                          {route.fromName}
                        </span>
                        <ArrowRight
                          size={14}
                          strokeWidth={2.2}
                          className="shrink-0 text-emerald-400/80"
                        />
                        <span className="truncate text-slate-300">
                          {route.toName}
                        </span>
                        <ArrowUpRight
                          size={14}
                          strokeWidth={2.2}
                          className="saved-open-icon"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(route.from, route.to)}
                        className="saved-mini-btn saved-mini-btn-danger"
                        title="Remove from favorites"
                        aria-label="Remove from favorites"
                      >
                        <X size={14} strokeWidth={2.2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Search form */}
      <form
        onSubmit={handlePlan}
        className="glass-card planner-card p-6 md:p-8 space-y-6"
      >
        <div className="planner-intro">
          <div>
            <p className="section-kicker mb-2">
              <span>Journey planner</span>
              <span className="section-rule" />
            </p>
            <h2 className="form-heading">Where are you headed?</h2>
            <p className="form-helper">
              Choose two stations to see the fastest route, fare, and transfers.
            </p>
          </div>
          <span className="route-mark" aria-hidden="true">
            A <ArrowRight size={13} strokeWidth={2.5} /> B
          </span>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="select-wrapper flex-1 w-full">
            <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
              From
            </label>
            <Select
              instanceId="from-station-select"
              options={stationOptions}
              placeholder="Where are you starting from?"
              isClearable
              value={stationOptions.find((o) => o.value === from) || null}
              onChange={(opt: SingleValue<{ value: string; label: string }>) =>
                setPair(opt ? opt.value : "", to)
              }
              styles={selectStyles}
              menuPortalTarget={
                typeof document !== "undefined" ? document.body : null
              }
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setPair(to, from);
            }}
            className="swap-btn rotate-90 hidden md:flex mx-auto"
            title="Swap origin and destination"
            aria-label="Swap origin and destination"
          >
            <ArrowUpDown size={15} strokeWidth={2.2} />
          </button>

          <div className="select-wrapper flex-1 w-full">
            <label className="block text-sm font-medium text-slate-300 mb-2 tracking-wide">
              To
            </label>
            <Select
              instanceId="to-station-select"
              options={stationOptions.filter((o) => o.value !== from)}
              placeholder="Where do you want to go?"
              isClearable
              value={stationOptions.find((o) => o.value === to) || null}
              onChange={(opt: SingleValue<{ value: string; label: string }>) =>
                setPair(from, opt ? opt.value : "")
              }
              styles={selectStyles}
              menuPortalTarget={
                typeof document !== "undefined" ? document.body : null
              }
            />
          </div>
        </div>

        <div className="flex flex-row items-center gap-4">
          {result && (
            <button
              type="button"
              onClick={copyShareLink}
              className="action-btn shrink-0 text-slate-400"
              title="Copy share link"
              aria-label="Copy share link"
            >
              <Link2 size={16} strokeWidth={2.2} />
            </button>
          )}

          {result && (
            <button
              type="button"
              onClick={() => toggleFavorite(result.from, result.to)}
              className={`action-btn shrink-0 ${isFavorite ? "text-rose-400" : "text-slate-400"}`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                size={16}
                strokeWidth={2.2}
                fill={isFavorite ? "currentColor" : "none"}
              />
            </button>
          )}

          <button
            disabled={routeMutation.isPending}
            className="btn-primary flex-1 min-w-0 sm:flex-none sm:w-auto flex items-center justify-center gap-2"
          >
            {routeMutation.isPending ? (
              <>
                <span className="spinner" />
                Finding Route...
              </>
            ) : (
              "Plan My Journey"
            )}
          </button>
        </div>

        {routeMutation.isError && (
          <div className="error-message fade-in">
            {(routeMutation.error as Error).message}
          </div>
        )}
      </form>

      {/* Result */}
      {result && (
        <section className="space-y-6 mt-8 stagger-children">
          <div className="glass-card p-6 fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Route Found</h2>
                <p className="result-flash-route">
                  {nameOf.get(result.from) ?? result.from}
                  <ArrowRight size={13} strokeWidth={2.4} />
                  {nameOf.get(result.to) ?? result.to}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-item">
                <span className="stat-value">
                  {Math.round(result.totalTimeMin)}
                </span>
                <span className="stat-label">Minutes</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">
                  {result.totalDistanceKm.toFixed(1)}
                </span>
                <span className="stat-label">Kilometers</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">₹{result.fare}</span>
                <span className="stat-label">Fare</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{result.transfers}</span>
                <span className="stat-label">
                  {result.transfers === 1 ? "Transfer" : "Transfers"}
                </span>
              </div>
            </div>
          </div>

          <div className="route-timeline">
            {result.segments.map((seg, idx) => (
              <div
                key={idx}
                className="fade-in"
                style={{ animationDelay: `${0.2 + idx * 0.15}s` }}
              >
                {/* Transfer header */}
                {idx > 0 && (
                  <div className="flex justify-center my-4">
                    <div
                      className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-wide"
                      style={{
                        backgroundColor: `${seg.color}22`,
                        color: seg.color,
                        border: `1px solid ${seg.color}45`,
                        boxShadow: `0 2px 10px rgba(0,0,0,0.25)`,
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="rotate-90"
                      >
                        <path d="M8 3 4 7l4 4" />
                        <path d="M4 7h16" />
                        <path d="m16 21 4-4-4-4" />
                        <path d="M20 17H4" />
                      </svg>
                      Change to {seg.line}
                    </div>
                  </div>
                )}

                <div className="glass-card overflow-hidden">
                  {/* Segment header */}
                  <div
                    className="px-5 py-3.5 flex justify-between items-center"
                    style={{
                      background: `linear-gradient(135deg, ${seg.color}18, ${seg.color}06)`,
                      borderBottom: `2px solid ${seg.color}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: seg.color,
                          color: readableOn(seg.color),
                          boxShadow: `0 2px 12px ${seg.color}55`,
                        }}
                      >
                        {seg.line}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                        {Math.round(seg.timeMin)} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M3.6 9h16.8M3.6 15h16.8" />
                          <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
                        </svg>
                        {seg.distanceKm.toFixed(1)} km
                      </span>
                    </div>
                  </div>

                  {/* Stations with rail */}
                  <div className="p-4">
                    <ol className="space-y-0">
                      {seg.stations.map((st, i) => {
                        const isSegmentStart = i === 0;
                        const isSegmentEnd = i === seg.stations.length - 1;
                        const isOrigin = isSegmentStart && idx === 0;
                        const isDestination =
                          isSegmentEnd && idx === result.segments.length - 1;
                        const isTransfer = isSegmentStart && idx > 0;

                        return (
                          <li
                            key={st.code}
                            className="station-item relative flex items-stretch gap-4 py-2.5"
                            style={{ animationDelay: `${0.05 * i}s` }}
                          >
                            {/* Rail + dot */}
                            <div className="w-3.5 shrink-0 relative flex justify-center">
                              {/* Rail */}
                              {!isSegmentEnd && (
                                <div
                                  className="absolute left-1/2 top-[17px] bottom-[-17px] -translate-x-1/2 w-0.75 rounded-full"
                                  style={{
                                    backgroundColor: `${seg.color}80`,
                                    boxShadow: `0 0 4px ${seg.color}30`,
                                  }}
                                />
                              )}

                              {/* Arrow */}
                              {!isSegmentEnd && (
                                <svg
                                  className="absolute left-1/2 bottom-[-17px] z-[2] w-3 h-3 -translate-x-1/2"
                                  viewBox="0 0 12 12"
                                  style={{
                                    filter: `drop-shadow(0 0 2px ${seg.color}aa)`,
                                  }}
                                  fill={seg.color}
                                >
                                  <path d="M4.5 0 L7.5 0 L7.5 4.5 L10 4.5 L6 12 L2 4.5 L4.5 4.5 Z" />
                                </svg>
                              )}

                              {/* Station dot */}
                              <span
                                className="relative z-10 mt-1 w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-black/30"
                                style={{
                                  backgroundColor: seg.color,
                                  boxShadow:
                                    isOrigin || isDestination
                                      ? `0 0 0 5px ${seg.color}30, 0 0 16px ${seg.color}80`
                                      : `0 0 0 4px ${seg.color}28`,
                                }}
                              />
                            </div>

                            {/* Station name + badges */}
                            <div className="flex flex-wrap items-center gap-3 min-w-0">
                              <Link
                                to={`/station/${st.code}`}
                                className={`block text-sm truncate ${
                                  isSegmentStart || isSegmentEnd
                                    ? "font-semibold text-white"
                                    : "text-slate-400 hover:text-white transition-colors"
                                }`}
                              >
                                {st.name}
                              </Link>

                              <div className="flex flex-wrap items-center gap-2">
                                {isOrigin && seg.fromPlatformNo !== null && (
                                  <span className="platform-chip emerald">
                                    <span className="platform-chip-dot">●</span>
                                    Board · Platform {seg.fromPlatformNo}
                                  </span>
                                )}

                                {isTransfer && seg.fromPlatformNo !== null && (
                                  <span className="platform-chip amber">
                                    <span className="platform-chip-dot">●</span>
                                    Change · Platform {seg.fromPlatformNo}
                                  </span>
                                )}

                                {isDestination && seg.toPlatformNo !== null && (
                                  <span className="platform-chip rose">
                                    <span className="platform-chip-dot">●</span>
                                    Exit · Platform {seg.toPlatformNo}
                                  </span>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
