import {Injectable} from '@angular/core';
import {AuthConfig, NullValidationHandler, OAuthService} from 'angular-oauth2-oidc';
import {filter} from 'rxjs/operators';

@Injectable()
export class AuthConfigService {

  private _decodedAccessToken: any;
  private _decodedIDToken: any;

  get decodedAccessToken() {
    return this._decodedAccessToken;
  }

  get decodedIDToken() {
    return this._decodedIDToken;
  }

  constructor(
    private readonly oauthService: OAuthService,
    private readonly authConfig: AuthConfig
  ) {
  }

  async initAuth(): Promise<any> {
    return new Promise<void>((resolveFn, rejectFn) => {
      // setup oauthService
      this.oauthService.configure(this.authConfig);
      this.oauthService.setStorage(localStorage);
      this.oauthService.tokenValidationHandler = new NullValidationHandler();

        // this.oauthService.events.subscribe(_ => {
        //   this.isAuthenticatedSubject$.next(this.oauthService.hasValidAccessToken());
        // });
        // this.oauthService.events.subscribe(
        //   hasReceivedTokens => {
        // if (hasReceivedTokens instanceof token_received ) {
        //     // this would have stored all the tokens needed
        //     if (hasReceivedTokens) {
        //       // carry on with your app
        //       return Promise.resolve();
        //
        //       /* if you wish to do something when the user receives tokens from the identity server,
        //        * use the event stream or the `onTokenReceived` callback in LoginOptions.
        //        *
        //        * this.oauthService.events(filter(e => e.type === 'token_received')).subscribe()
        //        */
        //     } else {
        //       // may want to check if you were previously authenticated
        //       if (this.oauthService.hasValidAccessToken() && this.oauthService.hasValidIdToken()) {
        //         return Promise.resolve();
        //       }
        //     }
        //   }
        // });

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
      // disabling keycloak for now
      // resolveFn();
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
  }

}
