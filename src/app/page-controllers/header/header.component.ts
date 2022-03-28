import { LayoutComponent } from './../../layout/layout.component';
import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/service/user.service';
import { User } from 'src/app/model/user';

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
              private userService: UserService) {
  }

  ngOnInit() {
  }

  logout() {
    this.oauthService.logOut();
  }

  goToMyProfile() {
    this.router.navigate(['usersManagement','userDetails', this.currentUser.id]);
  }

  private get currentUser(): User {
    var loggedUser = new User();
    loggedUser.id = '2';
    return loggedUser;

    //per recuperare le info dell'utente loggato
    //return this.loggedUserService.isLoggedIn ? this.loggedUserService.currentUser : null;
  }
}
