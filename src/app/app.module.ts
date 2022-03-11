import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {UserListComponent} from './user-list/user-list.component';
import {UserFormComponent} from './user-form/user-form.component';
import {FormsModule} from "@angular/forms";
import {HttpClientModule} from '@angular/common/http';
import {UserService} from './service/user.service';
import { OAuthModule } from 'angular-oauth2-oidc';

@NgModule({
  declarations: [
    AppComponent,
    UserListComponent,
    UserFormComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    OAuthModule.forRoot({
      resourceServer: {
        allowedUrls: ['http://localhost:9000/projectx/api'],
        sendAccessToken: true
      }
    })
  ],
  providers: [UserService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
