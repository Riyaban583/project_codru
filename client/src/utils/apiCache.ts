// src/utils/apiCache.ts

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// The centralized memory store for the entire app
const apiCache = new Map<string, { data: any; timestamp: number }>();

export const fetchWithCache = async (url: string, headers: any = {}, forceRefresh: boolean = false) => {
  const now = Date.now();

  // 1. Check if we have valid, unexpired data
  if (!forceRefresh && apiCache.has(url)) {
    const cached = apiCache.get(url);
    if (cached && (now - cached.timestamp < CACHE_DURATION)) {
      console.log(`⚡ Loaded from 10-min global cache: ${url}`);
      return cached.data;
    }
  }

  // 2. Fetch fresh data if missing, expired, or forced
  const res = await fetch(url, { headers });
  if (!res.ok) {
      throw new Error(`API fetch failed with status: ${res.status}`);
  }
  
  const data = await res.json();
  
  // 3. Save the fresh data to the global cache
  apiCache.set(url, { data, timestamp: now });
  
  return data;
};

// Optional: Useful if a user logs out and you want to wipe memory
export const clearApiCache = () => apiCache.clear();
export const invalidateCacheItem = (url: string) => apiCache.delete(url);