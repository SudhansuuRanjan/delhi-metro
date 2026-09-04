import { fetchDmrc } from "../dmrc";
import type { DmrcFareRoute } from "../dmrcTypes";

export interface FareBracket {
  maxDistanceKm: number;
  fare: number;
}

const DEFAULT_BRACKETS: FareBracket[] = [
  { maxDistanceKm: 2, fare: 20 },
  { maxDistanceKm: 5, fare: 30 },
  { maxDistanceKm: 12, fare: 40 },
  { maxDistanceKm: 21, fare: 50 },
  { maxDistanceKm: 32, fare: 60 },
  { maxDistanceKm: Infinity, fare: 70 },
];

/**
 * Sample real weekday fares from the route API across many distance ranges
 * and rebuild the fare bracket table. Returns null if sampling fails (caller
 * keeps previous brackets).
 */
export async function calibrateFares(
  pairs: { from: string; to: string; distanceKm: number }[]
): Promise<FareBracket[] | null> {
  const samples: { distanceKm: number; fare: number }[] = [];
  for (const p of pairs) {
    try {
      const r = (await fetchDmrc(
        `new_fare_with_route/${p.from}/${p.to}/least-distance/`
      )) as DmrcFareRoute;
      if (typeof r.weekday_fare === "number") {
        samples.push({ distanceKm: p.distanceKm, fare: r.weekday_fare });
      }
    } catch {
      // skip failed pairs
    }
  }
  if (samples.length < 6) return null;
  return buildBrackets(samples);
}

/**
 * Build monotonically increasing fare brackets from (distance, fare) samples.
 * DMRC's published weekday max is ₹64; anything above is an anomaly from a
 * failed/partial payload and is dropped.
 */
export function buildBrackets(
  samples: { distanceKm: number; fare: number }[]
): FareBracket[] {
  const DMRC_MAX_FARE = 64;
  const valid = samples.filter(
    (s) => Number.isFinite(s.fare) && s.fare > 0 && s.fare <= DMRC_MAX_FARE
  );
  const sorted = [...valid].sort((a, b) => a.distanceKm - b.distanceKm);
  const brackets: FareBracket[] = [];
  let lastFare = 0;
  for (const s of sorted) {
    if (s.fare > lastFare) {
      brackets.push({ maxDistanceKm: s.distanceKm, fare: s.fare });
      lastFare = s.fare;
    }
  }
  if (brackets.length === 0) return DEFAULT_BRACKETS;
  // Ensure the last bracket extends to infinity at the max observed fare.
  if (brackets[brackets.length - 1].fare < DMRC_MAX_FARE) {
    const maxDist = Math.max(...sorted.map((s) => s.distanceKm));
    brackets.push({ maxDistanceKm: Infinity, fare: DMRC_MAX_FARE });
    void maxDist;
  }
  return brackets;
}

export function fareForDistance(
  distanceKm: number,
  brackets: FareBracket[]
): number {
  for (const b of brackets) {
    if (distanceKm <= b.maxDistanceKm) return b.fare;
  }
  return brackets[brackets.length - 1]?.fare ?? 70;
}

export { DEFAULT_BRACKETS };
