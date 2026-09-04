import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  Map as MapIcon,
  Minus,
  Plus,
  RotateCcw,
  TrainFront,
} from "lucide-react";
import { useNetwork } from "../hooks";
import type { NetworkLine } from "../api";

interface Pt {
  code: string;
  name: string;
  x: number;
  y: number;
  interchange: boolean;
  lines: string[];
}

interface LinePath {
  line: NetworkLine;
  pts: Pt[];
  d: string;
}

const VIEW_W = 1000;
const VIEW_H = 1000;

/** Project a station to map space: prefer DMRC x/y, else lat/lng. */
function project(
  s: { lat: number | null; lng: number | null; x: number | null; y: number | null },
  xBounds: { min: number; max: number },
  yBounds: { min: number; max: number },
  lngBounds: { min: number; max: number },
  latBounds: { min: number; max: number },
): { x: number; y: number } {
  if (s.x !== null && s.y !== null) {
    const x =
      ((s.x - xBounds.min) / Math.max(1, xBounds.max - xBounds.min)) * VIEW_W;
    const y =
      ((s.y - yBounds.min) / Math.max(1, yBounds.max - yBounds.min)) * VIEW_H;
    return { x, y };
  }
  if (s.lat !== null && s.lng !== null) {
    const x =
      ((s.lng - lngBounds.min) / Math.max(1e-6, lngBounds.max - lngBounds.min)) *
      VIEW_W;
    // Latitude grows northward; SVG y grows downward.
    const y =
      (1 - (s.lat - latBounds.min) / Math.max(1e-6, latBounds.max - latBounds.min)) *
      VIEW_H;
    return { x, y };
  }
  return { x: VIEW_W / 2, y: VIEW_H / 2 };
}

export default function NetworkMapPage() {
  const { data: lines = [], isLoading, isError } = useNetwork();
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [view, setView] = useState({ x: 0, y: 0, w: VIEW_W, h: VIEW_H });
  const [selected, setSelected] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const panRef = useRef<{
    pointerId: number;
    startVX: number;
    startVY: number;
    startVW: number;
    startVH: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const model = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    const lngs: number[] = [];
    const lats: number[] = [];
    for (const l of lines) {
      for (const s of l.stations) {
        if (s.x !== null && s.y !== null) {
          xs.push(s.x);
          ys.push(s.y);
        }
        if (s.lat !== null && s.lng !== null) {
          lngs.push(s.lng);
          lats.push(s.lat);
        }
      }
    }
    const xBounds = { min: Math.min(...xs, 0), max: Math.max(...xs, 1) };
    const yBounds = { min: Math.min(...ys, 0), max: Math.max(...ys, 1) };
    const lngBounds = { min: Math.min(...lngs, 0), max: Math.max(...lngs, 1) };
    const latBounds = { min: Math.min(...lats, 0), max: Math.max(...lats, 1) };

    const linePaths: LinePath[] = lines.map((line) => {
      const pts: Pt[] = line.stations.map((s) => ({
        code: s.code,
        name: s.name,
        ...project(s, xBounds, yBounds, lngBounds, latBounds),
        interchange: s.interchange,
        lines: s.lines,
      }));
      const d = pts
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(" ");
      return { line, pts, d };
    });

    // Unique stations across lines (merge interchanges for dots).
    const stationMap = new Map<string, Pt & { name: string }>();
    for (const lp of linePaths) {
      for (const p of lp.pts) {
        const line = lines.find((l) => l.code === lp.line.code);
        const src = line?.stations.find((s) => s.code === p.code);
        if (!stationMap.has(p.code)) {
          stationMap.set(p.code, { ...p, name: src?.name ?? p.code });
        } else {
          const cur = stationMap.get(p.code)!;
          cur.interchange = cur.interchange || p.interchange;
          cur.lines = Array.from(new Set([...cur.lines, ...p.lines]));
        }
      }
    }

    const PAD = 40;
    const bounds = {
      minX: Math.min(...linePaths.flatMap((l) => l.pts.map((p) => p.x)), 0) - PAD,
      maxX: Math.max(...linePaths.flatMap((l) => l.pts.map((p) => p.x)), VIEW_W) + PAD,
      minY: Math.min(...linePaths.flatMap((l) => l.pts.map((p) => p.y)), 0) - PAD,
      maxY: Math.max(...linePaths.flatMap((l) => l.pts.map((p) => p.y)), VIEW_H) + PAD,
    };
    return { linePaths, stations: [...stationMap.values()], bounds };
  }, [lines]);

  const visiblePaths = model.linePaths.filter((lp) => !hidden.has(lp.line.code));
  const visibleCodes = new Set(visiblePaths.flatMap((lp) => lp.pts.map((p) => p.code)));
  const selectedStation = selected
    ? model.stations.find((s) => s.code === selected) ?? null
    : null;
  const selectedLines = selectedStation
    ? lines.filter((l) => selectedStation.lines.includes(l.code))
    : [];

  const toggleLine = (code: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const viewRef = useRef(view);
  viewRef.current = view;
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number } | null>(null);

  const clampView = (v: { x: number; y: number; w: number; h: number }) => {
    const w = Math.min(VIEW_W * 1.5, Math.max(VIEW_W * 0.03, v.w));
    const h = (w * v.h) / Math.max(1, v.w);
    const overX = VIEW_W * 0.6;
    const overY = VIEW_H * 0.6;
    return {
      w,
      h,
      x: Math.min(VIEW_W + overX - w, Math.max(-overX, v.x)),
      y: Math.min(VIEW_H + overY - h, Math.max(-overY, v.y)),
    };
  };

  const toSvg = (clientX: number, clientY: number) => {
    const el = svgRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const v = viewRef.current;
    return {
      x: v.x + ((clientX - rect.left) / Math.max(1, rect.width)) * v.w,
      y: v.y + ((clientY - rect.top) / Math.max(1, rect.height)) * v.h,
      rect,
    };
  };

  const zoomAtSvg = (sx: number, sy: number, factor: number) => {
    const v = viewRef.current;
    const w = Math.min(VIEW_W * 1.5, Math.max(VIEW_W * 0.03, v.w * factor));
    const h = (w * v.h) / v.w;
    const x = sx - ((sx - v.x) * w) / v.w;
    const y = sy - ((sy - v.y) * h) / v.h;
    setView(clampView({ x, y, w, h }));
  };

  const zoom = (factor: number) => {
    const v = viewRef.current;
    const cx = v.x + v.w / 2;
    const cy = v.y + v.h / 2;
    const w = Math.min(VIEW_W * 1.5, Math.max(VIEW_W * 0.03, v.w * factor));
    const h = (w * v.h) / v.w;
    setView(clampView({ x: cx - w / 2, y: cy - h / 2, w, h }));
  };

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const p = toSvg(e.clientX, e.clientY);
        if (!p) return;
        zoomAtSvg(p.x, p.y, Math.exp(e.deltaY * 0.0028));
        return;
      }
      const rect = el.getBoundingClientRect();
      const v = viewRef.current;
      const scaleX = v.w / Math.max(1, rect.width);
      const scaleY = v.h / Math.max(1, rect.height);
      setView((prev) =>
        clampView({
          ...prev,
          x: prev.x + e.deltaX * scaleX,
          y: prev.y + e.deltaY * scaleY,
        }),
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      pinchRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y) };
    }
    panRef.current = {
      pointerId: e.pointerId,
      startVX: viewRef.current.x,
      startVY: viewRef.current.y,
      startVW: viewRef.current.w,
      startVH: viewRef.current.h,
      originX: e.clientX,
      originY: e.clientY,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const prev = pinchRef.current;
      const cx = (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      const p = toSvg(cx, cy);
      pinchRef.current = { dist };
      if (prev && prev.dist > 0 && p && dist > 0) {
        zoomAtSvg(p.x, p.y, prev.dist / dist);
      }
      if (panRef.current) panRef.current.moved = true;
      return;
    }
    const pan = panRef.current;
    if (!pan || pan.pointerId !== e.pointerId) return;
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scaleX = pan.startVW / Math.max(1, rect.width);
    const scaleY = pan.startVH / Math.max(1, rect.height);
    const dxPx = e.clientX - pan.originX;
    const dyPx = e.clientY - pan.originY;
    if (Math.abs(dxPx) + Math.abs(dyPx) < 3 && !pan.moved) return;
    pan.moved = true;
    setView((v) =>
      clampView({
        ...v,
        x: pan.startVX - dxPx * scaleX,
        y: pan.startVY - dyPx * scaleY,
      }),
    );
  };

  const endPan = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    if (panRef.current?.pointerId === e.pointerId) panRef.current = null;
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const p = toSvg(e.clientX, e.clientY);
    if (!p) return;
    zoomAtSvg(p.x, p.y, 0.55);
  };

  const showLabels = view.w < VIEW_W * 0.5;
  const showAllLabels = view.w < VIEW_W * 0.22;
  const labelSize = view.w / 48;

  const resetView = () => {
    setView({ x: 0, y: 0, w: VIEW_W, h: VIEW_H });
    setSelected(null);
  };

  const interchangeCount = model.stations.filter((s) => s.interchange).length;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      <header className="app-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={15} strokeWidth={2.2} />
          Back to planner
        </Link>
        <div className="metro-icon">
          <MapIcon size={22} strokeWidth={2.2} />
        </div>
        <h1 className="app-title">Network Map</h1>
        <p className="app-subtitle">
          {lines.length > 0
            ? `${lines.length} lines · ${model.stations.length} stations · ${interchangeCount} interchanges`
            : "Full Delhi Metro network"}
        </p>
      </header>

      {isLoading && (
        <p className="text-center text-slate-500">Loading network map…</p>
      )}
      {isError && (
        <p className="text-center text-rose-400">
          Couldn't load the network. Try again later.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="map-layout">
          {/* Line legend / toggles */}
          <div className="glass-card map-legend">
            <h3 className="station-card-title station-card-title-tight">
              <TrainFront size={14} strokeWidth={2.2} />
              Lines
            </h3>
            <div className="map-legend-list">
              {lines.map((l) => {
                const off = hidden.has(l.code);
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => toggleLine(l.code)}
                    className={`map-legend-item ${off ? "off" : ""}`}
                    aria-pressed={!off}
                    title={off ? `Show ${l.name}` : `Hide ${l.name}`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{
                        backgroundColor: off ? "#475569" : l.color,
                        boxShadow: off ? "none" : `0 0 8px ${l.color}66`,
                      }}
                    />
                    <span className="truncate">{l.name}</span>
                    <span className="map-legend-count">{l.stations.length}</span>
                  </button>
                );
              })}
            </div>
            {(hidden.size > 0 || selected) && (
              <button
                type="button"
                onClick={() => {
                  setHidden(new Set());
                  setSelected(null);
                }}
                className="saved-clear-btn map-reset-btn"
              >
                <RotateCcw size={13} strokeWidth={2.2} />
                Show all
              </button>
            )}
          </div>

          {/* Map canvas */}
          <div className="glass-card map-canvas-card">
            <div className="map-toolbar">
              <div className="map-toolbar-group">
                <button
                  type="button"
                  onClick={() => zoom(0.7)}
                  className="map-tool-btn"
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <Plus size={15} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={() => zoom(1.4)}
                  className="map-tool-btn"
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <Minus size={15} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  className="map-tool-btn"
                  title="Reset view"
                  aria-label="Reset view"
                >
                  <RotateCcw size={14} strokeWidth={2.2} />
                </button>
              </div>
              <span className="map-hint">Drag to pan · scroll / pinch to zoom · tap a station</span>
            </div>

            <svg
              ref={svgRef}
              viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
              className="map-svg"
              role="img"
              aria-label="Delhi Metro network map"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endPan}
              onPointerCancel={endPan}
              onDoubleClick={onDoubleClick}
              style={{ cursor: panRef.current ? "grabbing" : "grab", touchAction: "none" }}
            >
              {visiblePaths.map(({ line, d }) => (
                <path
                  key={line.code}
                  d={d}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={view.w / 220}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.9}
                />
              ))}
              {model.stations.map((s) => {
                if (!visibleCodes.has(s.code)) return null;
                const visibleLines = s.lines.filter((c) => !hidden.has(c));
                const isSel = selected === s.code;
                const visInterchange = visibleLines.length > 1;
                const r = visInterchange
                  ? view.w / 130
                  : view.w / 200;
                const showThis = showAllLabels || visInterchange || isSel;
                return (
                  <g
                    key={s.code}
                    onClick={() => {
                      if (panRef.current?.moved) return;
                      setSelected(isSel ? null : s.code);
                    }}
                    className="map-station"
                  >
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={Math.max(r * 3, labelSize * 0.9)}
                      fill="transparent"
                    />
                    <circle
                      cx={s.x}
                      cy={s.y}
                      r={r}
                      fill={visInterchange ? "#0b0b1a" : "#cbd5e1"}
                      stroke={visInterchange ? "#fbbf24" : "#0b0b1a"}
                      strokeWidth={visInterchange ? r * 0.55 : r * 0.3}
                    />
                    {isSel && (
                      <circle
                        cx={s.x}
                        cy={s.y}
                        r={r * 2.4}
                        fill="none"
                        stroke="#34d399"
                        strokeWidth={r * 0.4}
                      />
                    )}
                    {showLabels && showThis && (
                      <text
                        x={s.x + r * 2.2}
                        y={s.y + labelSize * 0.35}
                        fontSize={labelSize * (visInterchange || isSel ? 1 : 0.85)}
                        fontWeight={visInterchange || isSel ? 700 : 500}
                        fill={isSel ? "#6ee7b7" : visInterchange ? "#fde68a" : "#e2e8f0"}
                        stroke="rgba(5,5,15,0.9)"
                        strokeWidth={labelSize * 0.12}
                        paintOrder="stroke"
                        pointerEvents="none"
                      >
                        {s.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Selected station card */}
            {selectedStation && (
              <div className="map-selected fade-in">
                <div className="map-selected-head">
                  <div className="min-w-0">
                    <p className="map-selected-name">{selectedStation.name}</p>
                    <p className="map-selected-meta">
                      {selectedStation.interchange ? (
                        <span className="inline-flex items-center gap-1 text-amber-300">
                          <ArrowLeftRight size={12} strokeWidth={2.4} />
                          Interchange · {selectedStation.lines.length} lines
                        </span>
                      ) : (
                        `${selectedStation.lines.length} line${selectedStation.lines.length === 1 ? "" : "s"}`
                      )}
                    </p>
                  </div>
                  <Link
                    to={`/station/${selectedStation.code}`}
                    className="map-selected-link"
                  >
                    Details
                  </Link>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedLines.map((l) => (
                    <span
                      key={l.code}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                      style={{
                        backgroundColor: `${l.color}22`,
                        color: l.color,
                        border: `1px solid ${l.color}40`,
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: l.color }}
                      />
                      {l.name.replace(" Line", "")}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="map-footer">
              <span className="inline-flex items-center gap-1.5">
                <span className="map-dot-hollow" /> Interchange
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="map-dot-solid" /> Station
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
