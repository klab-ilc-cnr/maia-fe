/**
 * Operational activity of the server (`GET /api/system/activity`, administrators only). Aggregates only: no user names,
 * sessions or tokens. Per server instance; `observedSince` is reset at every restart. All the instants are UTC ISO-8601
 * strings, with a variable fraction of second (up to nanoseconds).
 */
export interface ActivityStatus {
  /** start of the observation (the server process start) */
  observedSince: string;
  /** when the server computed this answer */
  observedAt: string;
  /** width of the "recent" window, in minutes */
  windowMinutes: number;
  /** distinct Maia users seen in the last `windowMinutes` (login/logout and authenticated requests) */
  activeUsers: number;
  /**
   * distinct Maia users active in the window EXCLUDING the caller (by identity, not "total minus 1"). Optional: servers
   * built before it was added do not send it; then only the total is shown. 0 is a real value.
   */
  otherActiveUsers?: number;
  /** requests being handled right now on /api, /texto, /lexo (not counting this one) */
  inFlightRequests: number;
  /** last authenticated activity seen by this process, even if older than the window; null = none since the start */
  lastAuthenticatedActivityAt: string | null;
}
