import { Component, OnInit } from '@angular/core';
import { OAuthService } from 'angular-oauth2-oidc';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { AuthConfigService } from 'src/app/config/authconfig.service';
import { MainLayoutComponent } from 'src/app/layouts/main-layout/main-layout.component';

/**Componente dell'intestazione di pagina */
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  /**
   * Costruttore per HeaderComponent
   * @param oauthService {OAuthService} servizi di autenticazione //TODO rimuovere per mancato utilizzo?
   * @param layout {MainLayoutComponent} componente del layout di base
   * @param router {Router} servizi per la navigazione fra le viste
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet //TODO rimuovere per mancato utilizzo?
   * @param userService {UserService} servizi relativi agli utenti //TODO rimuovere per mancato utilizzo?
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato 
   * @param authConfigService {AuthConfigService} servizi relativi alle configurazioni di autenticazione
   */
  constructor(private readonly oauthService: OAuthService,
              public layout: MainLayoutComponent,
              private router: Router,
              private activeRoute: ActivatedRoute,
              private userService: UserService,
              private loggedUserService : LoggedUserService,
              private authConfigService : AuthConfigService) {
  }

  //TODO verificare utilità, esegue solo un console di debug
  /**Metodo dell'interfaccia OnInit */
  ngOnInit() {
    console.log(this.loggedUserService.currentUser?.name);
  }

  /**Metodo che richiama il logout dell'utente */
  logout() {
    this.authConfigService.logout()
  }

  /**Metodo che esegue la navigazione sui dettagli dell'utente loggato */
  goToMyProfile() {
    this.router.navigate(['usersManagement','userDetails', this.loggedUserService.currentUser?.id]);
  }
}
