import type { Env } from "@/types";

export const DMRC_BASE_URL = "https://backend.delhimetrorail.com/api/v2/en";

export const DMRC_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/139.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.delhimetrorail.com/",
  Origin: "https://www.delhimetrorail.com",
};

export class DmrcError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504]);

/**
 * Fetch a JSON payload from the DMRC backend with browser headers,
 * retries (exponential backoff), and a hard timeout.
 */
export async function fetchDmrc(
  path: string,
  opts: { timeoutMs?: number; retries?: number } = {}
): Promise<unknown> {
  const { timeoutMs = 15_000, retries = 3 } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const backoff = 500 * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, backoff));
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${DMRC_BASE_URL}/${path}`, {
        headers: DMRC_HEADERS,
        signal: ctrl.signal,
      });
      if (!res.ok) {
        if (RETRYABLE.has(res.status) && attempt < retries) {
          lastErr = new DmrcError(`HTTP ${res.status} for ${path}`, res.status);
          continue;
        }
        throw new DmrcError(`HTTP ${res.status} for ${path}`, res.status);
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (err instanceof DmrcError && !RETRYABLE.has(err.status)) throw err;
      if (attempt >= retries) break;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new DmrcError(`Failed to fetch ${path}`, 0);
}

/** Run an async job per item with a bounded concurrency. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

export { type Env };
