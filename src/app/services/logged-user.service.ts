import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { StorageService } from './storage.service';

/**Class of services for managing the logged-in user */
@Injectable({
  providedIn: 'root'
})
export class LoggedUserService {

  /**
   * Constructor for LoggedUserService
   * @param storageService {StorageService} Services to manage the local storage
   */
  constructor(
    private storageService: StorageService,
  ) { }

  /**Getter of logged-in user data */
  public get currentUser(): User | undefined {
    const storageUser = this.storageService.getCurrentUser();
    if (!storageUser) {
      return undefined;
    }
    return storageUser;
  }

  /**
   * Method that evaluates whether the user is authorized to manage users
   * @returns {boolean} defines whether the user is authorized
   */
  public canManageUsers(): boolean {
    const user = this.currentUser;
    if (user === null && user === undefined) {
      return false;
    }
    return (user?.role === "ADMINISTRATOR");
  }

  /**
   * Method that evaluates whether the user is authorized to manage layers
   * @returns {boolean} defines whether the user is authorized
   */
  public canManageLayers(): boolean {
    const user = this.currentUser;
    if (user === null && user === undefined) {
      return false;
    }
    return (user?.role === "ADMINISTRATOR");
  }

  /**
   * Method that evaluates whether the user is authorized to manage tagsets
   * @returns {boolean} defines whether the user is authorized
   */
  public canManageTagsets(): boolean {
    const user = this.currentUser;
    if (user === null && user === undefined) {
      return false;
    }
    return (user?.role === "ADMINISTRATOR");
  }

  /**
   * Method that evaluates whether the user is authorized to manage lexicon
   * @returns {boolean} defines whether the user is authorized
   */
  public canManageLexicon(): boolean {
    const user = this.currentUser;
    if (!user || user === undefined) return false;
    return user.role === "ADMINISTRATOR";
  }

}
