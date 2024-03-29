import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { faChevronDown, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { filter } from 'rxjs/operators';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { environment } from 'src/environments/environment';

/**Componente del menu laterale di navigazione */
@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent {
  demoHide = environment.demoHide; //TODO rimuovere non appena pienamente implementato
  /**Icona freccia espandi */
  faChevronDown = faChevronDown;
  /**Icona freccia comprimi */
  faChevronLeft = faChevronLeft;

  /**Path corrente in forma di lista di stringhe */
  public currentPath: string[] = [''];

  /**
   * Costruttore per SideMenuComponent
   * @param router {Router} servizi per la navigazione fra le viste //TODO valutare rimozione per mancato uso
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato
   */
  constructor(
    private router: Router,
    private loggedUserService : LoggedUserService
  ) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(evt => this.onNavigate((<NavigationEnd>evt).urlAfterRedirects));
  }

  /**Getter restituisce se l'utente è autorizzato alla gestione utenti */
  public get canManageUsers(): boolean {
    return this.loggedUserService.canManageUsers();
  }

  /**Getter restituisce se l'utente è autorizzato alla gestione layer */
  public get canManageLayers(): boolean{
    return this.loggedUserService.canManageLayers();
  }

  /**Getter restituisce se l'utente è autorizzato alla gestione tagset */
  public get canManageTagsets(): boolean{
    return this.loggedUserService.canManageTagsets();
  }

  public get canManageLexicon(): boolean { return this.loggedUserService.canManageLexicon(); }

  /**
   * Metodo che valuta se un path è attivo
   * @param urls {string[]} url da valutare
   * @returns {boolean} definisce se un path è attivo
   */
  public isActive(urls: string[]): boolean {
    let isActive = false;
    urls.forEach(url => {
      if (this.isActiveInternal(url)) {
        isActive = true;
        return;
      }
    });

    return isActive;
  }

  /**
   * Metodo che dato un url verifica se questo è attivo (tutte le sue parti sono presenti nel path corrente)
   * @param url {string} url da verificare
   * @returns {boolean} definisce se il percorso è attivo
   */
  public isActiveInternal(url: string): boolean {
    const requiredPath = url.split("/") || [''];
    for (let i = 0; i < requiredPath.length; i++) {
      if ((this.currentPath.length <= i) ||
        (requiredPath[i].toLowerCase() != this.currentPath[i].toLowerCase())) {
        return false;
      }
    }

    return true;
  }

  /**
   * Metodo che rimuove eventuali slash iniziali e/o finali dall'url verso cui navigare
   * @param url {string} url verso cui navigare
   */
  public onNavigate(url: string) {
    const withoutLeadingSlash = url.startsWith("/") ? url.substr(1) : url;
    const withoutLeadingEndingSlash = url.endsWith("/") ? url.slice(0, -1) : withoutLeadingSlash;
    this.currentPath = withoutLeadingEndingSlash.split("/");
  }

}
