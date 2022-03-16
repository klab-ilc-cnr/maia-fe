import {Component} from '@angular/core';
// import {NullValidationHandler, OAuthService, AuthConfig} from 'angular-oauth2-oidc';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'projectxFE';

  constructor(
    // private oauthService: OAuthService
  ) {
    // this.configure();
  }

  // authConfig: AuthConfig = {
  //   issuer: 'http://localhost:8080/auth/realms/princnr',
  //   redirectUri: window.location.origin + "/users",
  //   clientId: 'projectx-fe',
  //   //dummyClientSecret: '2ea5dc66-8e1c-4e7c-aac0-52a42594a6ac',
  //   scope: 'openid profile email offline_access users',
  //   responseType: 'code',
  //   requireHttps: false,
  //   // at_hash is not present in JWT token
  //   disableAtHashCheck: true,
  //   //postLogoutRedirectUri: window.location.origin + "/heroes",
  //   showDebugInformation: true
  // }

  // public login() {
  //   this.oauthService.initLoginFlow();
  // }
  //
  // public logoff() {
  //   this.oauthService.logOut();
  // }

  // private configure() {
  //   this.oauthService.configure(this.authConfig);
  //   this.oauthService.tokenValidationHandler = new NullValidationHandler();
  //   this.oauthService.loadDiscoveryDocumentAndLogin().then(
  //     (isLoggedIn) => {
  //
  //       if (isLoggedIn) {
  //         this.oauthService.setupAutomaticSilentRefresh();
  //         // resolveFn();
  //       } else {
  //         this.oauthService.initImplicitFlow();
  //         // rejectFn();
  //       }
  //     },
  //     (error) => {
  //       console.log({ error });
  //       if (error.status === 400) {
  //         location.reload();
  //       }
  //     }
  //   );
  //   // this.oauthService.events.subscribe(_ => {
  //   //   this.isAuthenticatedSubject$.next(this.oauthService.hasValidAccessToken());
  //   // });
  //   // this.oauthService.events.subscribe(
  //   //   hasReceivedTokens => {
  //   // if (hasReceivedTokens instanceof token_received ) {
  //   //     // this would have stored all the tokens needed
  //   //     if (hasReceivedTokens) {
  //   //       // carry on with your app
  //   //       return Promise.resolve();
  //   //
  //   //       /* if you wish to do something when the user receives tokens from the identity server,
  //   //        * use the event stream or the `onTokenReceived` callback in LoginOptions.
  //   //        *
  //   //        * this.oauthService.events(filter(e => e.type === 'token_received')).subscribe()
  //   //        */
  //   //     } else {
  //   //       // may want to check if you were previously authenticated
  //   //       if (this.oauthService.hasValidAccessToken() && this.oauthService.hasValidIdToken()) {
  //   //         return Promise.resolve();
  //   //       }
  //   //     }
  //   //   }
  //   // });
  // }
}
