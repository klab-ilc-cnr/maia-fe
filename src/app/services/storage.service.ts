import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { User } from '../models/user';

const TOKEN_KEY = 'jwt-token';
const EXPIRATION_KEY = 'token_expiration';
const USER_KEY = 'current-user';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  tokenTimeout = new Subject<any>();

  public setToken(jwt: string): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, jwt);
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  public setExpiration(): void {
    const expDate = new Date().getTime() + 5400000; //attualmente scade dopo 90 minuti
    setTimeout(() => {
      this.tokenTimeout.next(null);
    }, 1000); //TODO replace with actual value
    localStorage.removeItem(EXPIRATION_KEY);
    localStorage.setItem(EXPIRATION_KEY, expDate.toString())
  }

  public getExpiration(): number|null {
    const exp = localStorage.getItem(EXPIRATION_KEY)
    return exp ? +exp : null;
  }

  public setCurrentUser(currentUser: User): void {
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
  }
  public getCurrentUser(): User | null {
    const storageUser = localStorage.getItem(USER_KEY);
    if (storageUser) {
      return JSON.parse(storageUser);
    }
    return null;
  }

  public isLoggedIn(): boolean {
    const currentUser = this.getCurrentUser();
    const jwt = this.getToken();
    if (currentUser && jwt) {
      return true;
    }
    return false;
  }

  public isExpired(): boolean {
    const exp = this.getExpiration();
    if(!exp) {
      return this.isLoggedIn();
    }
    const current = new Date().getTime();
    return current >= exp;
  }

  public cleanStorage(): void {
    localStorage.clear();
  }
}
