/**
 * WAMID Deduplicator with 48-hour TTL
 * Prevents processing Meta webhook duplicate retries.
 */

class WamidDeduplicator {
  constructor(ttlMs = 48 * 60 * 60 * 1000) {
    this.ttlMs = ttlMs;
    this.seen = new Map(); // wamid -> expiry timestamp

    // Periodic sweep every 30 minutes
    setInterval(() => this.cleanup(), 30 * 60 * 1000);
  }

  /**
   * Attempts to record a WAMID.
   * Returns true if it was NEW, false if it is a DUPLICATE.
   */
  checkAndSet(wamid) {
    if (!wamid) return true;

    const now = Date.now();
    const expiry = this.seen.get(wamid);

    if (expiry && expiry > now) {
      // Already seen and within TTL
      return false;
    }

    // New wamid or expired
    this.seen.set(wamid, now + this.ttlMs);
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [wamid, expiry] of this.seen.entries()) {
      if (expiry <= now) {
        this.seen.delete(wamid);
      }
    }
  }
}

export const wamidDeduplicator = new WamidDeduplicator();
