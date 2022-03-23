import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {UserListComponent} from './user-list/user-list.component';
import {UserFormComponent} from './user-form/user-form.component';
import {FormsModule, ReactiveFormsModule } from "@angular/forms";
import {HttpClientModule} from '@angular/common/http';
import {UserService} from './service/user.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthConfigModule } from './config/auth.config.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LayoutComponent } from './layout/layout.component';
import { PageControllersModule } from './page-controllers/page-controllers.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
// import { OAuthModule } from 'angular-oauth2-oidc';
// import { AuthModule } from './auth/auth.module';

@NgModule({
  declarations: [
    AppComponent,
    UserListComponent,
    UserFormComponent,
    LayoutComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    AuthConfigModule,
    NgbModule,
    PageControllersModule,
    FontAwesomeModule,
    ReactiveFormsModule
    // AuthModule
    // OAuthModule.forRoot({
    //   resourceServer: {
    //     allowedUrls: ['http://localhost:9000/projectx/api'],
    //     sendAccessToken: true
    //   }
    // })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
