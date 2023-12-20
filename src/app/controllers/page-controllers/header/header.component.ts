import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MainLayoutComponent } from 'src/app/layouts/main-layout/main-layout.component';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { StorageService } from 'src/app/services/storage.service';
import { environment } from 'src/environments/environment';

/**Componente dell'intestazione di pagina */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  applicationSubTitle = environment.applicationSubTitle;
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
  ) {
  }

  /**Metodo che richiama il logout dell'utente */
  logout() {
    this.storageService.cleanStorage();
    this.router.navigate(['/login']);
  }

  /**Metodo che esegue la navigazione sui dettagli dell'utente loggato */
  goToMyProfile() {
    this.router.navigate(['usersManagement', 'userDetails', this.loggedUserService.currentUser?.id]);
  }
}
