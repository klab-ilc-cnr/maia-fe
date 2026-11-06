import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { StorageService } from './storage.service';

/**
 * Handles the end of the user session: recognizes the errors that mean "the token is no longer valid" and sends the
 * user back to the login with an explicit message (instead of leaving the app apparently working but with every
 * call failing).
 *
 * Why it is not enough to look at the status code: maia-be checks the jwt itself only on its own `/api` calls (403 with
 * "JWT expired ..."). On `/texto` and `/lexo` it forwards the token to TexO/LexO, which answer 401, and maia-be turns
 * that into a generic 500 without a message. So a 500 is also taken as "session expired" when the token is, locally,
 * expired.
 */
@Injectable({
  providedIn: 'root'
})
export class SessionService {
  /** true while the "session expired" message is displayed: parallel failing calls show it only once */
  private expiring = false;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private translateService: TranslateService,
  ) { }

  /**
   * Tells whether an http error means that the session is over.
   * @param error {HttpErrorResponse} error of the call
   * @returns {boolean}
   */
  public isSessionError(error: HttpErrorResponse): boolean {
    if (!this.storageService.isLoggedIn()) {
      return false; // nobody is logged in (login page, already logged out): wrong credentials etc. are handled by the caller
    }
    if (/\/authentication\//.test(error.url ?? '')) {
      return false; // login and renewal errors are handled by their callers
    }
    if (error.status === 401) {
      return true;
    }
    const expiredLocally = this.storageService.isExpired();
    if (error.status === 403) {
      // 403 is also "forbidden for your role": it is the end of the session only if the server speaks about the jwt
      return expiredLocally || /jwt|token/i.test(typeof error.error === 'string' ? error.error : JSON.stringify(error.error ?? ''));
    }
    return error.status === 500 && expiredLocally;
  }

  /** Ends the session: clears the stored login, tells the user, goes to the login page. Safe to call many times. */
  public expire(): void {
    if (this.expiring) {
      return;
    }
    this.expiring = true;
    this.storageService.cleanStorage(); // the calls that fail meanwhile are no longer "logged in" and stay quiet
    Swal.fire({
      icon: 'warning',
      titleText: this.translateService.instant('SESSION.expiredTitle'),
      text: this.translateService.instant('SESSION.expiredText'),
      allowOutsideClick: false,
      confirmButtonText: 'Ok',
    }).then(() => {
      this.expiring = false;
      this.router.navigate(['/login']);
    });
  }

  /** Called when the page becomes visible again (after a long time in the background or the computer sleeping) */
  public checkExpired(): void {
    if (this.storageService.isLoggedIn() && this.storageService.isExpired()) {
      this.expire();
    }
  }
}
