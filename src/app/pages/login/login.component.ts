import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, take } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { CommonService } from 'src/app/services/common.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm = new FormGroup({
    username: new FormControl<string>('', Validators.required),
    password: new FormControl<string>('', Validators.required),
  });

  constructor(
    private authenticationService: AuthenticationService,
    private storageService: StorageService,
    private userService: UserService,
    private router: Router,
    private commonService: CommonService,
  ) { }

  onSubmit() {
    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;
    if (!username || !password) {
      return;
    }
    this.authenticationService.login({ username: username, password: password }).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, 'Authentication failed')),
    ).subscribe(jwt => {
      this.storageService.setToken(jwt);
      this.storageService.setExpiration();
      this.retrieveCurrentUser();
    });
  }

  private retrieveCurrentUser(): void {
    this.userService.retrieveCurrentUser().pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, 'Retrieve current user failed'))
    ).subscribe(user => {
      this.storageService.setCurrentUser(user);
      this.router.navigate(['']);
    })
  }

}
