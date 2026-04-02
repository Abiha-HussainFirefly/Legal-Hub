type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitRecord>();

// Garbage collection
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    store.forEach((record, key) => {
      if (now > record.resetAt) store.delete(key);
    });
  }, 60 * 1000);
}

export function getRateLimit(key: string) {
  const now = Date.now();
  const record = store.get(key);
  if (!record || now > record.resetAt) return { count: 0 };
  return record;
}

export function incrementRateLimit(key: string, windowMs: number) {
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return 1;
  }

  record.count += 1;
  return record.count;
}

export function resetRateLimit(key: string) {
  store.delete(key);
}

/**
 * Global API Rate Limiter Logic
 */
export function applyGlobalLimit(ip: string): { success: boolean; status: number; message?: string } {
  // 10 requests per 1 minute per IP
  return applyCustomLimit(`global_${ip}`, 10, 60 * 1000, "Too many requests. Please slow down.");
}

/**
 * Custom Threshold Rate Limiter
 */
export function applyCustomLimit(key: string, limit: number, windowMs: number, message: string = "Too many attempts."): { success: boolean; status: number; message?: string } {
  const current = getRateLimit(key);
  if (current.count >= limit) {
    return { success: false, status: 429, message };
  }

  incrementRateLimit(key, windowMs);
  return { success: true, status: 200 };
}
