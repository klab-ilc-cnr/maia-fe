import { LayoutComponent } from './../../layout/layout.component';
import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  constructor(private readonly oauthService: OAuthService, public layout: LayoutComponent) { }

  ngOnInit() {
  }

  logout() {
    this.oauthService.logOut();
  }

}
