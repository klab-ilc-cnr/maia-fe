import {Injectable} from '@angular/core';
import {AuthConfig, NullValidationHandler, OAuthService} from 'angular-oauth2-oidc';
import {filter} from 'rxjs/operators';
import { LoggedUserService } from '../services/logged-user.service';
import { UserService } from '../services/user.service';

/**Classe dei servizi di configurazione dell'autenticazione */
@Injectable()
export class AuthConfigService {

  /**Access token decodificato */
  private _decodedAccessToken: any;
  /**ID token decodificato */
  private _decodedIDToken: any;
  /**Jwt parsato */
  private _parsedJwt: any;

  /**Getter che restituisce l'access token decodificato */
  get decodedAccessToken() {
    return this._decodedAccessToken;
  }

  /**Getter che restituisce l'ID token decodificato */
  get decodedIDToken() {
    return this._decodedIDToken;
  }

  /**
   * Metodo che recupera il Jwt parsato
   * @returns {any} il Jwt parsato
   */
  public parsedJwt(){
    return this._parsedJwt;
  }

  /**Metodo che invoca il logout */
  logout() {
    this.oauthService.logOut();
  }

  /**
   * Costruttore per AuthConfigService
   * @param oauthService {OAuthService} servizio per il login e logout con OIDC e OAuth2
   * @param authConfig {AuthConfig} configurazione di autenticazione
   * @param loggedUserService {LoggedUserService} servizi per l'utente loggato
   * @param userService {UserService} servizi per gli utenti
   */
  constructor(
    private readonly oauthService: OAuthService,
    private readonly authConfig: AuthConfig,
    private loggedUserService: LoggedUserService,
    private userService : UserService
  ) {
  }

  /**
   * Metodo che inizializza l'autenticazione
   * @returns {Promise<any>} ?
   */
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

  /**
   * @private
   * Metodo per la gestione di un nuovo token
   */
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

  /**
   * @private
   * Metodo che esegue il parsing del Jwt
   * @param token {string} token
   * @returns {any} Jwt parsato
   */
  private parseJwt (token: string) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};

}
