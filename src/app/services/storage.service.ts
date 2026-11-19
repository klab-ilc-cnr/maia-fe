import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { User } from '../models/user';

const TOKEN_KEY = 'jwt-token';
const EXPIRATION_KEY = 'token_expiration';
const USER_KEY = 'current-user';

/**Services to manage the local storage */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  /**Subject signaling the expiration of the token */
  tokenTimeout = new Subject<any>();
  tokenPrefix: string;
  private warningTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.tokenPrefix = document.URL.split('/#')[0];
  }

  /**
   * Set the jwt token in local storage
   * @param jwt {string} jwt token
   */
  public setToken(jwt: string): void {
    localStorage.removeItem(`${this.tokenPrefix}_${TOKEN_KEY}`);
    localStorage.setItem(`${this.tokenPrefix}_${TOKEN_KEY}`, jwt);
  }

  /**
   * Retrieve jwt token from local storage
   * @returns {string|null} jwt token value
   */
  public getToken(): string | null {
    return localStorage.getItem(`${this.tokenPrefix}_${TOKEN_KEY}`);
  }

  /**Sets the expiration date of the token and starts the timeout */
  public setExpiration(): void {
    const expDate = new Date().getTime() + 5400000; //token expire after 90 minutes
    localStorage.removeItem(`${this.tokenPrefix}_${EXPIRATION_KEY}`);
    localStorage.setItem(`${this.tokenPrefix}_${EXPIRATION_KEY}`, expDate.toString());
    this.scheduleExpirationWarning();
  }

  /**
   * Schedules the "you are about to be disconnected" warning (30 s before the expiration saved in the local storage).
   * The timer lives only in memory: it is lost when the page is reloaded (F5) or the computer sleeps, so the app
   * calls this again at startup. Calling it more than once replaces the previous timer.
   */
  public scheduleExpirationWarning(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = undefined;
    }
    const exp = this.getEffectiveExpiration();
    if (!exp || !this.isLoggedIn()) {
      return;
    }
    const delay = exp - new Date().getTime() - 30000; //warning displayed 30s before token expiration
    if (delay <= 0) {
      return; // already expired (or about to): the session service takes care of it
    }
    this.warningTimer = setTimeout(() => {
      this.warningTimer = undefined;
      this.tokenTimeout.next(null);
    }, delay);
  }

  /**
   * Expiration timestamp (ms) used by the app: the earliest between the one saved at login (90 minutes) and the `exp`
   * claim of the jwt itself, if readable.
   */
  public getEffectiveExpiration(): number | null {
    const saved = this.getExpiration();
    const jwtExp = this.getJwtExpiration();
    if (saved && jwtExp) {
      return Math.min(saved, jwtExp);
    }
    return saved ?? jwtExp;
  }

  /** `exp` claim of the jwt in ms, or null if the token is missing or not readable */
  private getJwtExpiration(): number | null {
    try {
      const payload = this.getToken()?.split('.')[1];
      if (!payload) {
        return null;
      }
      const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof json.exp === 'number' ? json.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  /**
   * Retrieve expiration date from local storage
   * @returns {number|null} expiration date
   */
  public getExpiration(): number | null {
    const exp = localStorage.getItem(`${this.tokenPrefix}_${EXPIRATION_KEY}`)
    return exp ? +exp : null;
  }

  /**
   * Set the current user in the local storage
   * @param currentUser {User} logged user
   */
  public setCurrentUser(currentUser: User): void {
    localStorage.removeItem(`${this.tokenPrefix}_${USER_KEY}`);
    localStorage.setItem(`${this.tokenPrefix}_${USER_KEY}`, JSON.stringify(currentUser));
  }

  /**
   * Retrieve current user from local storage (if the user is logged in)
   * @returns {User|null} logged user
   */
  public getCurrentUser(): User | null {
    const storageUser = localStorage.getItem(`${this.tokenPrefix}_${USER_KEY}`);
    if (storageUser) {
      return JSON.parse(storageUser);
    }
    return null;
  }

  /**
   * Check if the user is logged in
   * @returns {boolean} is the user logged in
   */
  public isLoggedIn(): boolean {
    const currentUser = this.getCurrentUser();
    const jwt = this.getToken();
    if (currentUser && jwt) {
      return true;
    }
    return false;
  }

  /**
   * Check if the jwt token is expired
   * @returns {boolean} is the jwt token expired
   */
  public isExpired(): boolean {
    const exp = this.getEffectiveExpiration();
    if (!exp) {
      return this.isLoggedIn();
    }
    const current = new Date().getTime();
    return current >= exp;
  }

  /**Clean local storage */
  public cleanStorage(): void {
    for (const key in localStorage) {
      if (key.indexOf(`${this.tokenPrefix}_`) >= 0) {
        localStorage.removeItem(key);
      }
    }
  }
}
