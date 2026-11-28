import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject, take, takeUntil } from 'rxjs';
import { ActivityStatus } from 'src/app/models/activity-status';
import { SystemService } from 'src/app/services/system.service';

/**
 * Recent activity of the server (administrators): distinct users seen in the last minutes, requests in progress, last
 * authenticated activity and since when the server observes. These are NOT "connected users": the server has no sessions
 * to count. If the status cannot be read the page says so ("Stato non disponibile"): it never shows zeros in its place.
 */
@Component({
  selector: 'app-activity-status',
  templateUrl: './activity-status.component.html',
  styleUrls: ['./activity-status.component.scss'],
  standalone: false
})
export class ActivityStatusComponent implements OnInit, OnDestroy {
  /** last status read, null while it is unknown or unavailable */
  status: ActivityStatus | null = null;
  /** true when the last reading failed (or the answer was not a valid status) */
  unavailable = false;
  loading = false;

  private unsubscribe$ = new Subject<void>();

  constructor(
    private systemService: SystemService,
    private translateService: TranslateService,
  ) { }

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  /** Reads the status again. The previous values are dropped first: after an error no old number stays on screen. */
  refresh(): void {
    this.loading = true;
    this.unavailable = false;
    this.status = null;
    this.systemService.getActivity().pipe(
      take(1),
      takeUntil(this.unsubscribe$),
    ).subscribe({
      next: status => {
        this.loading = false;
        if (this.isValid(status)) {
          this.status = status;
        } else {
          this.unavailable = true;
        }
      },
      error: () => {
        this.loading = false;
        this.unavailable = true;
      },
    });
  }

  /**
   * An instant of the server (UTC) shown in the time zone of the user's browser, with the zone name (e.g. "28/11/2026,
   * 09:40:55 CET"). Fractions of second beyond the milliseconds are cut: browsers only parse up to 3 digits reliably.
   * @param instant {string|null} ISO-8601 UTC string
   * @returns {string} formatted text, or an empty one if it is not a valid instant
   */
  formatInstant(instant: string | null | undefined): string {
    const date = this.parseInstant(instant);
    if (!date) { return ''; }
    const locale = this.translateService.currentLang || this.translateService.defaultLang || undefined;
    return date.toLocaleString(locale, {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      timeZoneName: 'short',
    });
  }

  private parseInstant(instant: string | null | undefined): Date | null {
    if (typeof instant !== 'string' || !instant) { return null; }
    const date = new Date(instant.replace(/(\.\d{3})\d+/, '$1'));
    return isNaN(date.getTime()) ? null : date;
  }

  /** The answer has the fields that the page shows (an unexpected body, e.g. an HTML page, is "not available") */
  private isValid(status: ActivityStatus | null): status is ActivityStatus {
    return !!status
      && typeof status.windowMinutes === 'number'
      && typeof status.activeUsers === 'number'
      && typeof status.inFlightRequests === 'number'
      && (status.otherActiveUsers === undefined || status.otherActiveUsers === null || typeof status.otherActiveUsers === 'number')
      && !!this.parseInstant(status.observedSince)
      && !!this.parseInstant(status.observedAt)
      && (status.lastAuthenticatedActivityAt === null || !!this.parseInstant(status.lastAuthenticatedActivityAt));
  }
}
