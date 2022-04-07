import { Injectable } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { AuthConfigService } from '../config/authconfig.service';
import { Roles } from '../model/roles';
import { User } from '../model/user';

@Injectable({
  providedIn: 'root'
})
export class LoggedUserService {

  //TODO popolare lo user
  private loggedUser : User;

  constructor(private readonly oauthService: OAuthService,
    private authConfigService : AuthConfigService) {
      this.loggedUser = new User();
     }

  logout() {
    this.oauthService.logOut();
  }

  public name() {
    let claims = this.oauthService.getIdentityClaims();
    if (!claims) return null;
    return claims;
  }

  public canManageUsers(): boolean{
    let res = this.authConfigService.parsedJwt();
    return (res.realm_access.roles.indexOf(Roles.AMMINISTRATORE) > -1);
  }

  public getUser(): User{
    //TODO popolare user
    this.loggedUser.id = "1";
    return this.loggedUser;
  }

}
