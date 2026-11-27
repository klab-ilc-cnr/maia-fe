import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MainLayoutComponent } from 'src/app/layouts/main-layout/main-layout.component';
import { AuthenticationService } from 'src/app/services/authentication.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { StorageService } from 'src/app/services/storage.service';
import { environment } from 'src/environments/environment';

/**Componente dell'intestazione di pagina */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false
})
export class HeaderComponent {
  applicationSubTitle = ` - ${environment.applicationSubTitle}`;;
  loggedUserName = this.loggedUserService.currentUser?.name + ' ' + this.loggedUserService.currentUser?.surname;

  /**
   * Costruttore per HeaderComponent
   * @param layout {MainLayoutComponent} componente del layout di base
   * @param router {Router} servizi per la navigazione fra le viste
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato 
   */
  constructor(
    public layout: MainLayoutComponent,
    private router: Router,
    private loggedUserService: LoggedUserService,
    private storageService: StorageService,
    private authService: AuthenticationService,
  ) {
  }

  /**Metodo che richiama il logout dell'utente */
  logout() {
    // this button exists only in the main layout: an open workspace has no "Logout" (it saves its layout when it is left)
    // 1. audit of the explicit logout in maia-be: not waited for, errors ignored. The token is read when the request
    //    starts, so it must go out BEFORE the local logout removes it
    this.authService.notifyLogout();
    // 2. local logout
    this.storageService.cleanStorage();
    this.router.navigate(['/login']);
  }

  /**Metodo che esegue la navigazione sui dettagli dell'utente loggato */
  goToMyProfile() {
    this.router.navigate(['usersManagement', 'userDetails', this.loggedUserService.currentUser?.id]);
  }
}
