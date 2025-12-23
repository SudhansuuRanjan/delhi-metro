// lib/fare.ts
export function calculateFare(distanceKm: number): number {
  if (distanceKm <= 2) return 20;
  if (distanceKm <= 5) return 30;
  if (distanceKm <= 12) return 40;
  if (distanceKm <= 21) return 50;
  if (distanceKm <= 32) return 60;
  return 70;
}
