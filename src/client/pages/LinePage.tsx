import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";
import { useLineStations, useLines } from "../hooks";

export default function LinePage() {
  const { code = "" } = useParams();
  const { data: lines = [] } = useLines();
  const { data: stations = [], isLoading } = useLineStations(code);

  const line = lines.find((l) => l.code === code);
  const color = line?.color ?? "#888";
  const interchangeCount = stations.filter((s) => s.interchange).length;

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      <header className="app-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={15} strokeWidth={2.2} />
          Back to planner
        </Link>
        <div className="line-badge mx-auto" style={{ backgroundColor: `${color}25`, color, border: `1px solid ${color}40` }}>
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          {line?.name ?? code}
        </div>
        <h1 className="app-title mt-4">Line {code}</h1>
        <p className="app-subtitle">{stations.length} stations</p>
      </header>

      {isLoading ? (
        <p className="text-center text-slate-500">Loading stations...</p>
      ) : (
        <>
          {/* Quick stats */}
          {stations.length > 0 && (
            <div className="flex justify-center gap-3 mb-6">
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300">
                {stations.length} stations
              </span>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-slate-300">
                {interchangeCount} interchange{interchangeCount === 1 ? "" : "s"}
              </span>
            </div>
          )}

          <div className="glass-card p-6">
            <ol className="space-y-0">
              {stations.map((s, i) => {
                const isFirst = i === 0;
                const isLast = i === stations.length - 1;
                const isEndpoint = isFirst || isLast;
                return (
                  <li key={s.code} className="flex items-stretch gap-4">
                    {/* Rail + dot */}
                    <div className="w-[14px] flex flex-col items-center relative flex-shrink-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full z-10 flex-shrink-0 ring-2 ring-black/30 mt-1"
                        style={{
                          backgroundColor: color,
                          boxShadow: isEndpoint
                            ? `0 0 0 5px ${color}30, 0 0 16px ${color}80`
                            : `0 0 0 4px ${color}28`,
                        }}
                      />
                      {!isLast && (
                        <div className="w-[3px] flex-1 min-h-[6px] self-center" style={{ backgroundColor: `${color}50` }} />
                      )}
                    </div>

                    {/* Station name + badges */}
                    <div className="min-w-0 flex-1 py-1.5">
                      <Link
                        to={`/station/${s.code}`}
                        className={`block text-sm truncate ${isEndpoint ? "font-semibold text-white" : "text-slate-300 hover:text-white transition-colors"}`}
                      >
                        {s.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {s.interchange && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/25 uppercase tracking-wide">
                            <ArrowLeftRight size={11} strokeWidth={2.4} />
                            Interchange
                          </span>
                        )}
                        {s.otherLines.map((ol) => (
                          <span
                            key={ol.code}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
                            style={{ backgroundColor: `${ol.color}22`, color: ol.color, border: `1px solid ${ol.color}40` }}
                            title={ol.name}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ol.color }} />
                            {ol.name.replace(" Line", "")}
                          </span>
                        ))}
                        {s.stationType && (
                          <span className="text-[10px] text-slate-500">{s.stationType}</span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
