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

  /**
   * Set the jwt token in local storage
   * @param jwt {string} jwt token
   */
  public setToken(jwt: string): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, jwt);
  }

  /**
   * Retrieve jwt token from local storage
   * @returns {string|null} jwt token value
   */
  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**Sets the expiration date of the token and starts the timeout */
  public setExpiration(): void {
    const expDate = new Date().getTime() + 5400000; //token expire after 90 minutes
    setTimeout(() => {
      this.tokenTimeout.next(null);
    }, 5370000); //warning displayed 30s before token expiration
    localStorage.removeItem(EXPIRATION_KEY);
    localStorage.setItem(EXPIRATION_KEY, expDate.toString())
  }

  /**
   * Retrieve expiration date from local storage
   * @returns {number|null} expiration date
   */
  public getExpiration(): number | null {
    const exp = localStorage.getItem(EXPIRATION_KEY)
    return exp ? +exp : null;
  }

  /**
   * Set the current user in the local storage
   * @param currentUser {User} logged user
   */
  public setCurrentUser(currentUser: User): void {
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  }

  /**
   * Retrieve current user from local storage (if the user is logged in)
   * @returns {User|null} logged user
   */
  public getCurrentUser(): User | null {
    const storageUser = localStorage.getItem(USER_KEY);
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
    const exp = this.getExpiration();
    if (!exp) {
      return this.isLoggedIn();
    }
    const current = new Date().getTime();
    return current >= exp;
  }

  /**Clean local storage */
  public cleanStorage(): void {
    localStorage.clear();
  }
}
