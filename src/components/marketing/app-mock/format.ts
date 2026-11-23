const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Integer cents to "$1,234.50". */
export function usd(cents: number): string {
  return USD.format(cents / 100);
}

/** Seconds to "h:mm". */
export function clock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Seconds to "h:mm:ss" (running timers). */
export function clockSeconds(totalSeconds: number): string {
  return `${clock(totalSeconds)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}
