import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, take } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { CommonService } from 'src/app/services/common.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';

/**Component for logging into the application */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  subTitle = environment.applicationSubTitle;
  /**Authentication data form */
  loginForm = new FormGroup({
    username: new FormControl<string>('', Validators.required),
    password: new FormControl<string>('', Validators.required),
  });

  /**
   * Constructor for LoginComponent
   * @param authenticationService {AuthenticationService} A service that provides authentication token
   * @param storageService {StorageService} Service to manage the local storage
   * @param userService {UserService} Provides users management
   * @param router {Router} A service that provides navigation among views and URL manipulation capabilities
   * @param commonService {CommonService} Provides messages management
   */
  constructor(
    private authenticationService: AuthenticationService,
    private storageService: StorageService,
    private userService: UserService,
    private router: Router,
    private commonService: CommonService,
  ) { }

  /**
   * Method that uses the login form to log in and save the authentication token in local storage
   * @returns {void}
   */
  onSubmit() {
    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;
    if (!username || !password) {
      return;
    }
    this.authenticationService.login({ username: username, password: password }).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, this.commonService.translateKey('LOGIN.authFailed'))),
    ).subscribe(jwt => {
      this.storageService.setToken(jwt);
      this.storageService.setExpiration();
      this.retrieveCurrentUser();
    });
  }

  /**Method that retrieves the logged-in user and saves it in local storage */
  private retrieveCurrentUser(): void {
    this.userService.retrieveCurrentUser().pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, this.commonService.translateKey('LOGIN.errorRetrievingUser'))),
    ).subscribe(user => {
      this.storageService.setCurrentUser(user);
      this.router.navigate(['']);
    })
  }

}
