import { Injectable } from '@angular/core';
import { User } from '../models/user';

const TOKEN_KEY = 'jwt-token';
const USER_KEY = 'current-user';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  public setToken(jwt: string): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(TOKEN_KEY, jwt);
  }

  public getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
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

  public cleanStorage(): void {
    localStorage.clear();
  }
}
