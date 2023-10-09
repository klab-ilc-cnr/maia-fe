import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs/operators';
import { AuthenticationService } from 'src/app/services/authentication.service';
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
  ) { }

  onSubmit() {
    const username = this.loginForm.get('username')?.value;
    const password = this.loginForm.get('password')?.value;
    if (!username || !password) {
      return;
    }
    this.authenticationService.login({ username: username, password: password }).pipe(//TODO aggiungere gestione errore con msg
      take(1),
    ).subscribe(jwt => {
      this.storageService.setToken(jwt);
      this.userService.retrieveCurrentUser().pipe(take(1)).subscribe(user => console.info(user))
    });
  }

}
