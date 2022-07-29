import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/model/user';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { AuthConfigService } from 'src/app/config/authconfig.service';
import { LayoutComponent } from 'src/app/layout/layout.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  constructor(private readonly oauthService: OAuthService,
              public layout: LayoutComponent,
              private router: Router,
              private activeRoute: ActivatedRoute,
              private userService: UserService,
              private loggedUserService : LoggedUserService,
              private authConfigService : AuthConfigService) {
  }

  ngOnInit() {
    console.log(this.loggedUserService.currentUser?.name);
  }

  logout() {
    this.authConfigService.logout()
  }

  goToMyProfile() {
    this.router.navigate(['usersManagement','userDetails', this.loggedUserService.currentUser?.id]);
  }
}
