import { Observable, catchError, shareReplay, throwError } from 'rxjs';

/**
 * Small in-memory cache of http answers, by key, with an expiration. It keeps the observable (shared, replayed to every
 * subscriber), so several consumers asking for the same thing at the same time make one request. A failed request is not
 * kept. It lives as long as the page: an F5 empties it.
 * Meant for data that changes rarely (layer features, tagset values) and for which a stale copy is harmless for a few minutes.
 */
export class TtlCache<K, V> {
  private entries = new Map<K, { at: number; value: Observable<V> }>();

  /**
   * @param ttlMs {number} how long (ms) an answer is reused
   */
  constructor(private ttlMs: number) { }

  /**
   * Returns the cached observable of `key`, or the one made by `factory` (and keeps it).
   * @param key {K} what is asked for
   * @param factory {Function} makes the request
   */
  public get(key: K, factory: () => Observable<V>): Observable<V> {
    const entry = this.entries.get(key);
    if (entry && Date.now() - entry.at < this.ttlMs) {
      return entry.value;
    }
    const value: Observable<V> = factory().pipe(
      catchError(error => {
        if (this.entries.get(key)?.value === value) {
          this.entries.delete(key); // a failure must not be served again
        }
        return throwError(() => error);
      }),
      shareReplay(1),
    );
    this.entries.set(key, { at: Date.now(), value });
    return value;
  }

  /** Forgets everything (to call when the data is changed from this app) */
  public clear(): void {
    this.entries.clear();
  }
}
