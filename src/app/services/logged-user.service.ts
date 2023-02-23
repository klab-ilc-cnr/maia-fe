import { Injectable } from '@angular/core';
import { Roles } from '../models/roles';
import { User } from '../models/user';

const CURRENT_USER_LOCAL_STORAGE = 'currentUser';

@Injectable({
  providedIn: 'root'
})
export class LoggedUserService {

  constructor() { }

  public get currentUser(): User | undefined {
    return this.retrieveUserFromStorage();
  }

  /**
   * Metodo che valuta se l'utente è autorizzato alla gestione utenze
   * @returns {boolean} definisce se l'utente può gestire le utenze
   */
  public canManageUsers(): boolean{
    let user = this.currentUser;
    if(user === null && user === undefined)
    {
      return false;
    }
    return (user?.role === (Roles.AMMINISTRATORE));
  }

  /**
   * Metodo che valuta se l'utente è autorizzato alla gestione dei layer
   * @returns {boolean} definisce se l'utente può gestire i layer
   */
  public canManageLayers(): boolean{
    let user = this.currentUser;
    if(user === null && user === undefined)
    {
      return false;
    }
    return (user?.role === (Roles.AMMINISTRATORE));
  }

  /**
   * Metodo che valuta se l'utente è autorizzato alla gestione dei tagset
   * @returns {boolean} definisce se l'utente può gestire i tagset
   */
  public canManageTagsets(): boolean{
    let user = this.currentUser;
    if(user === null && user === undefined)
    {
      return false;
    }
    return (user?.role === (Roles.AMMINISTRATORE));
  }

  public registerUser(user: User) {
    this.setUserInStorage(user);
  }

  private retrieveUserFromStorage(): User | undefined {
    var userObject = localStorage.getItem(CURRENT_USER_LOCAL_STORAGE);
    if(userObject == null || userObject == undefined)
    {
      return undefined;
    }

    return JSON.parse(userObject);
  }

  private setUserInStorage(user: User): void {
    localStorage.setItem(CURRENT_USER_LOCAL_STORAGE, JSON.stringify(user));
  }

  // public name() {
  //   let claims = this.oauthService.getIdentityClaims();
  //   if (!claims) return null;
  //   return claims;
  // }

  // public getUser(): User | undefined{
  //   //TODO popolare user
  //   //this.loggedUser.id = "1";
  //   //return this.loggedUser;
  //   return this.retrieveUserFromStorage();
  // }

}
