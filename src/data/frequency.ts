// data/frequency.ts
import type { LineId } from "./stations";

export interface LineFrequency {
  peak: string;
  offPeak: string;
  night: string;
}

/**
 * Peak  : ~8–11 AM, 5–8 PM
 * OffPeak: Day non-rush hours
 * Night : After ~9:30 PM
 *
 * Values are approximate & realistic for DMRC
 */
export const LINE_FREQUENCY: Record<LineId, LineFrequency> = {
  Yellow: {
    peak: "2–3 min",
    offPeak: "5–6 min",
    night: "7–10 min",
  },

  Blue: {
    peak: "2–4 min",
    offPeak: "5–7 min",
    night: "7–10 min",
  },

  Red: {
    peak: "4–6 min",
    offPeak: "6–8 min",
    night: "8–12 min",
  },

  Green: {
    peak: "5–8 min",
    offPeak: "8–12 min",
    night: "12–15 min",
  },

  Violet: {
    peak: "3–5 min",
    offPeak: "6–8 min",
    night: "8–12 min",
  },

  Pink: {
    peak: "4–6 min",
    offPeak: "6–8 min",
    night: "8–12 min",
  },

  Magenta: {
    peak: "6–8 min",
    offPeak: "8–12 min",
    night: "12–15 min",
  },

  Grey: {
    peak: "10–15 min",
    offPeak: "15–20 min",
    night: "—",
  },

  Orange: {
    peak: "10–15 min",
    offPeak: "15–20 min",
    night: "—",
  },

  Rapid: {
    peak: "4–6 min",
    offPeak: "6–8 min",
    night: "8–10 min",
  },
};
