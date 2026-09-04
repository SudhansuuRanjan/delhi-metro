import { Link, useParams } from "react-router-dom";
import {
  Accessibility,
  ArrowLeft,
  ArrowLeftRight,
  Baby,
  BadgeCheck,
  Bike,
  Car,
  CircleParking,
  Clock,
  Coffee,
  DoorOpen,
  Droplet,
  Info,
  Landmark,
  Phone,
  Smartphone,
  SquareParking,
  TrainFront,
  ArrowUpDown,
  UtensilsCrossed,
  Wifi,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStation } from "../hooks";

/** Map DMRC amenity names to Lucide icons. */
const AMENITY_ICONS: Array<{ match: string; Icon: LucideIcon }> = [
  { match: "Divyang Friendly", Icon: Accessibility },
  { match: "Parking", Icon: SquareParking },
  { match: "Lift/Escalator", Icon: ArrowUpDown },
  { match: "Escalator", Icon: ArrowUpDown },
  { match: "Lift", Icon: ArrowUpDown },
  { match: "Elevator", Icon: ArrowUpDown },
  { match: "Restroom", Icon: Droplet },
  { match: "Toilet", Icon: Droplet },
  { match: "Washroom", Icon: Droplet },
  { match: "ATM", Icon: Landmark },
  { match: "Bank", Icon: Landmark },
  { match: "WiFi", Icon: Wifi },
  { match: "Food", Icon: UtensilsCrossed },
  { match: "Restaurant", Icon: UtensilsCrossed },
  { match: "Cafe", Icon: Coffee },
  { match: "Coffee", Icon: Coffee },
  { match: "Drinking Water", Icon: Droplet },
  { match: "Water", Icon: Droplet },
  { match: "Trolley", Icon: BadgeCheck },
  { match: "Baby Care", Icon: Baby },
  { match: "Baby", Icon: Baby },
  { match: "Shopping", Icon: Coffee },
];

function AmenityIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  const found = AMENITY_ICONS.find((a) =>
    lower.includes(a.match.toLowerCase()),
  );
  const Icon = found?.Icon ?? BadgeCheck;
  return <Icon size={16} strokeWidth={2} className="shrink-0 text-emerald-300" />;
}

function countText(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : (plural ?? singular + "s")}`;
}

export default function StationPage() {
  const { code = "" } = useParams();
  const { data: station, isLoading, isError } = useStation(code);

  return (
    <div className="max-w-4xl mx-auto px-4 pb-16">
      <header className="app-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={15} strokeWidth={2.2} />
          Back to planner
        </Link>
        <div className="metro-icon">🚉</div>
        <h1 className="app-title">{station?.name ?? code}</h1>
        <p className="app-subtitle">
          {station?.stationType ?? ""}
          {station?.interchange ? " · Interchange" : ""}
        </p>
        {station?.commercialName && station.commercialName !== station.name && (
          <p className="text-xs text-slate-500 mt-1">{station.commercialName}</p>
        )}
      </header>

      {isLoading && <p className="text-center text-slate-500">Loading station...</p>}
      {isError && <p className="text-center text-rose-400">Station not found</p>}

      {station && (
        <div className="space-y-6">
          {/* Description */}
          {station.facilities.description && (
            <div className="glass-card p-6 fade-in">
              <h3 className="station-card-title">
                <Info size={14} strokeWidth={2.2} />
                About this station
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {station.facilities.description}
              </p>
            </div>
          )}

          {/* Amenities */}
          {station.facilities.amenities.length > 0 && (
            <div className="glass-card p-6 fade-in">
              <h3 className="station-card-title">
                <BadgeCheck size={14} strokeWidth={2.2} />
                Amenities
                <span className="saved-count">
                  {station.facilities.amenities.length}
                </span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {station.facilities.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                    <AmenityIcon name={a} />
                    <span className="text-xs font-medium text-slate-200 leading-tight">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lines */}
          <div className="glass-card p-6 fade-in">
            <h3 className="station-card-title">
              <TrainFront size={14} strokeWidth={2.2} />
              Metro Lines
            </h3>
            <div className="flex flex-wrap gap-2">
              {station.lines.map((l) => (
                <Link key={l.code} to={`/line/${l.code}`} className="line-badge" style={{ backgroundColor: `${l.color}25`, color: l.color, border: `1px solid ${l.color}40` }}>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Timings */}
          {(station.firstTrain || station.lastTrain) && (
            <div className="glass-card p-6 fade-in">
              <h3 className="station-card-title">
                <Clock size={14} strokeWidth={2.2} />
                First / Last Train
              </h3>
              <div className="flex gap-6 text-sm">
                <span className="text-slate-300">First: <span className="text-emerald-400 font-semibold">{station.firstTrain}</span></span>
                <span className="text-slate-300">Last: <span className="text-rose-400 font-semibold">{station.lastTrain}</span></span>
              </div>
            </div>
          )}

          {/* Gates */}
          {station.facilities.gates.length > 0 && (
            <div className="glass-card p-6 fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="station-card-title station-card-title-tight">
                  <DoorOpen size={14} strokeWidth={2.2} />
                  Gates
                </h3>
                <span className="text-xs text-slate-500">{countText(station.facilities.gates.length, "gate")}</span>
              </div>
              <div className="space-y-2">
                {station.facilities.gates.map((g) => (
                  <div key={g.name} className="flex items-center gap-3 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                    <DoorOpen size={16} strokeWidth={2} className="shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-200">{g.name}</p>
                      {g.location && <p className="text-xs text-slate-500 truncate">{g.location}</p>}
                    </div>
                    {g.divyangFriendly && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                        <Accessibility size={12} strokeWidth={2.2} />
                        Divyang
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lifts / Escalators */}
          {station.facilities.lifts.length > 0 && (
            <div className="glass-card p-6 fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="station-card-title station-card-title-tight">
                  <ArrowUpDown size={14} strokeWidth={2.2} />
                  Lifts & Escalators
                </h3>
                <span className="text-xs text-slate-500">{countText(station.facilities.lifts.length, "unit")}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {station.facilities.lifts.map((l) => (
                  <div key={l.name} className="flex items-center gap-2.5 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl">
                    <ArrowUpDown size={16} strokeWidth={2} className="shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200">{l.name}</p>
                      {l.location && <p className="text-[11px] text-slate-500 truncate">{l.location}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Parking */}
          {station.facilities.parking.length > 0 && (
            <div className="glass-card p-6 fade-in">
              <h3 className="station-card-title">
                <CircleParking size={14} strokeWidth={2.2} />
                Parking
              </h3>
              <div className="space-y-2">
                {station.facilities.parking.map((p, i) => (
                  <div key={i} className="px-3 py-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <SquareParking size={16} strokeWidth={2} className="shrink-0 text-slate-400" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-200">{p.provider ?? "Parking"}</p>
                        {p.location && <p className="text-xs text-slate-500">{p.location}</p>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {p.car !== null && p.car !== undefined && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                          <Car size={12} strokeWidth={2.2} />
                          {p.car} cars
                        </span>
                      )}
                      {p.motorcycle !== null && p.motorcycle !== undefined && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                          <Bike size={12} strokeWidth={2.2} />
                          {p.motorcycle} bikes
                        </span>
                      )}
                      {p.cycle !== null && p.cycle !== undefined && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                          <Bike size={12} strokeWidth={2.2} />
                          {p.cycle} cycles
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          {(station.facilities.mobile || station.facilities.landline) && (
            <div className="glass-card p-6 fade-in">
              <h3 className="station-card-title">
                <Phone size={14} strokeWidth={2.2} />
                Contact
              </h3>
              <div className="flex flex-wrap gap-4 text-sm">
                {station.facilities.mobile && (
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <Smartphone size={14} strokeWidth={2.2} className="text-slate-500" />
                    <a href={`tel:${station.facilities.mobile}`} className="text-emerald-400 hover:text-emerald-300">{station.facilities.mobile}</a>
                  </span>
                )}
                {station.facilities.landline && (
                  <span className="inline-flex items-center gap-1.5 text-slate-300">
                    <Phone size={14} strokeWidth={2.2} className="text-slate-500" />
                    <a href={`tel:${station.facilities.landline}`} className="text-emerald-400 hover:text-emerald-300">{station.facilities.landline}</a>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Nearby stations */}
          {station.adjacent.length > 0 && (
            <div className="glass-card p-6 fade-in">
              <h3 className="station-card-title">
                <ArrowLeftRight size={14} strokeWidth={2.2} />
                Nearby Stations
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {station.adjacent.map((a) => (
                  <Link key={`${a.code}-${a.lineCode}`} to={`/station/${a.code}`} className="saved-route-item">
                    <TrainFront size={14} strokeWidth={2.2} className="shrink-0 text-slate-500" />
                    <span className="truncate">{a.name}</span>
                    <span className="text-xs text-slate-500 ml-auto">
                      {Math.round(a.timeMin)} min · {a.distanceKm.toFixed(1)} km
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
