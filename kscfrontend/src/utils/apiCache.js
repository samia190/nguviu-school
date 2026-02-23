/**
 * Simple in-memory API cache with TTL.
 * Caches GET responses so repeat visits don't re-fetch.
 * Data stays fresh for `ttl` ms (default 2 minutes).
 */

const cache = new Map();
const inflight = new Map(); // dedup parallel requests to same URL
const DEFAULT_TTL = 2 * 60 * 1000; // 2 minutes

/**
 * Cached GET — returns cached data if fresh, otherwise fetches.
 * @param {string} path  API path like "/api/content/home"
 * @param {Function} fetchFn  The actual fetch function (e.g. `get` from api.js)
 * @param {number} ttl  Cache lifetime in ms (default 2 min)
 */
export async function cachedGet(path, fetchFn, ttl = DEFAULT_TTL) {
  const now = Date.now();
  const entry = cache.get(path);

  // Return cached if still fresh
  if (entry && now - entry.time < ttl) {
    return entry.data;
  }

  // Deduplicate: if already fetching this path, wait for it
  if (inflight.has(path)) {
    return inflight.get(path);
  }

  const promise = fetchFn(path)
    .then((data) => {
      cache.set(path, { data, time: Date.now() });
      inflight.delete(path);
      return data;
    })
    .catch((err) => {
      inflight.delete(path);
      // Return stale data on error if available
      if (entry) return entry.data;
      throw err;
    });

  inflight.set(path, promise);
  return promise;
}

/** Invalidate a specific cache entry */
export function invalidateCache(path) {
  cache.delete(path);
}

/** Clear all cache */
export function clearCache() {
  cache.clear();
}
