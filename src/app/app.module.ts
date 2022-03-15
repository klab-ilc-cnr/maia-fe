import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {UserListComponent} from './user-list/user-list.component';
import {UserFormComponent} from './user-form/user-form.component';
import {FormsModule} from "@angular/forms";
import {HttpClientModule} from '@angular/common/http';
import {UserService} from './service/user.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthConfigModule } from './config/auth.config.module';
import { HeaderComponent } from './header/header.component';
// import { OAuthModule } from 'angular-oauth2-oidc';
// import { AuthModule } from './auth/auth.module';

@NgModule({
  declarations: [
    AppComponent,
    UserListComponent,
    UserFormComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    AuthConfigModule,
    // AuthModule
    // OAuthModule.forRoot({
    //   resourceServer: {
    //     allowedUrls: ['http://localhost:9000/projectx/api'],
    //     sendAccessToken: true
    //   }
    // })
  ],
  providers: [UserService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
