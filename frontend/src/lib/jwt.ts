/** True if the token is missing, unreadable, or expires within `skewSeconds`. */
export function isExpiringSoon(token: string | null, skewSeconds = 30, nowMs: number = Date.now()): boolean {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: number };
    if (typeof exp !== "number") return true;
    return exp * 1000 - nowMs < skewSeconds * 1000;
  } catch {
    return true;
  }
}
