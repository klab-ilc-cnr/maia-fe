import {Injectable} from '@angular/core';
import {AuthConfig, NullValidationHandler, OAuthService} from 'angular-oauth2-oidc';
import {filter} from 'rxjs/operators';
import { LoggedUserService } from '../service/logged-user.service';
import { UserService } from '../service/user.service';

@Injectable()
export class AuthConfigService {

  private _decodedAccessToken: any;
  private _decodedIDToken: any;
  private _parsedJwt: any;

  get decodedAccessToken() {
    return this._decodedAccessToken;
  }

  get decodedIDToken() {
    return this._decodedIDToken;
  }

  public parsedJwt(){
    return this._parsedJwt;
  }

  logout() {
    this.oauthService.logOut();
  }

  constructor(
    private readonly oauthService: OAuthService,
    private readonly authConfig: AuthConfig,
    private loggedUserService: LoggedUserService,
    private userService : UserService
  ) {
  }

  async initAuth(): Promise<any> {
    return new Promise<void>((resolveFn, rejectFn) => {
      // setup oauthService
      this.oauthService.configure(this.authConfig);
      this.oauthService.setStorage(localStorage);
      this.oauthService.tokenValidationHandler = new NullValidationHandler();

      // subscribe to token events
      this.oauthService.events
        .pipe(filter((e: any) => {
          return e.type === 'token_received';
        }))
        .subscribe(() =>
        {
          this.handleNewToken()
          console.debug('state', this.oauthService.state);
          const scopes = this.oauthService.getGrantedScopes();
          console.debug('scopes', scopes);
        });

      // continue initializing app or redirect to login-page

      this.oauthService.loadDiscoveryDocumentAndLogin().then(
        (isLoggedIn) => {
          if (isLoggedIn) {
            this.oauthService.setupAutomaticSilentRefresh();
            resolveFn();
          } else {
            this.oauthService.initImplicitFlow();
            rejectFn();
          }
        },
        (error) => {
          console.log({error});
          if (error.status === 400) {
            location.reload();
          }
        }
      );
    });
  }

  private handleNewToken() {
    this._decodedAccessToken = this.oauthService.getAccessToken();
    this._decodedIDToken = this.oauthService.getIdToken();
    this._parsedJwt = this.parseJwt(this.oauthService.getAccessToken());

    //(this._parsedJwt.realm_access.roles.indexOf(Roles.AMMINISTRATORE) > -1);
    //console.log(this._parsedJwt);
    
    this.userService.retrieveCurrentUser()
    .subscribe(
      currentUser => {
        this.loggedUserService.registerUser(currentUser);        
      }
    )
  }

  private parseJwt (token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

}
