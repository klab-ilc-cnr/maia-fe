import {NgModule, APP_INITIALIZER} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {OAuthModule, AuthConfig, OAuthModuleConfig} from 'angular-oauth2-oidc';

import {AuthConfigService} from './authconfig.service';
import {authConfig, authModuleConfig} from './auth.config';

export function init_app(authConfigService: AuthConfigService) {
  return () => authConfigService.initAuth();
}

@NgModule({
  imports: [
    HttpClientModule,
    OAuthModule.forRoot()
  ],
  providers: [
    AuthConfigService,
    {provide: AuthConfig, useValue: authConfig},
    {provide: OAuthModuleConfig, useValue: authModuleConfig},
    {
      provide: APP_INITIALIZER,
      useFactory: init_app,
      deps: [AuthConfigService],
      multi: true
    }
  ]
})
export class AuthConfigModule {
}
