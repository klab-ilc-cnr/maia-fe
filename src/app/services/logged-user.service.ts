import { Injectable } from '@angular/core';
import { User } from '../models/user';
import { StorageService } from './storage.service';

/**Classe dei servizi per l'utente loggato */
@Injectable({
  providedIn: 'root'
})
export class LoggedUserService {

  /**Costruttore per LoggedUserService */
  constructor(
    private storageService: StorageService,
  ) { }

  /**Getter dei dati dell'utente loggato */
  public get currentUser(): User | undefined {
    const storageUser = this.storageService.getCurrentUser();
    if (!storageUser) {
      return undefined;
    }
    return storageUser;
  }

  /**
   * Metodo che valuta se l'utente è autorizzato alla gestione utenze
   * @returns {boolean} definisce se l'utente può gestire le utenze
   */
  public canManageUsers(): boolean {
    const user = this.currentUser;
    if (user === null && user === undefined) {
      return false;
    }
    return (user?.role === "ADMINISTRATOR");
  }

  /**
   * Metodo che valuta se l'utente è autorizzato alla gestione dei layer
   * @returns {boolean} definisce se l'utente può gestire i layer
   */
  public canManageLayers(): boolean {
    const user = this.currentUser;
    if (user === null && user === undefined) {
      return false;
    }
    return (user?.role === "ADMINISTRATOR");
  }

  /**
   * Metodo che valuta se l'utente è autorizzato alla gestione dei tagset
   * @returns {boolean} definisce se l'utente può gestire i tagset
   */
  public canManageTagsets(): boolean {
    const user = this.currentUser;
    if (user === null && user === undefined) {
      return false;
    }
    return (user?.role === "ADMINISTRATOR");
  }

  public canManageLexicon(): boolean {
    const user = this.currentUser;
    if (!user || user === undefined) return false;
    return user.role === "ADMINISTRATOR";
  }

}
