export function compactNumber(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) {
    const n = value / 1000;
    return `${n >= 10 ? Math.round(n) : n.toFixed(1).replace(/\.0$/, "")}K`;
  }
  const m = value / 1_000_000;
  return `${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M`;
}

/** Short relative time such as "3m", "5h", "2d". Empty when unknown. */
export function timeAgo(millis: number): string {
  if (!millis) return "";
  const seconds = Math.max(Math.floor((Date.now() - millis) / 1000), 0);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
