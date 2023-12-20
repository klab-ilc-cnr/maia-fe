import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Table } from 'primeng/table';
import { UserService } from 'src/app/services/user.service';

/**Componente della tabella delle anagrafiche utenti */
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent {

  /**Riferimento alla tabella di visualizzazione */
  @ViewChild('dt') public dt: Table | undefined

  /**Lista degli utenti */
  public users = this.userService.findAll();

  /**
   * Costruttore per UserListComponent
   * @param router {Router} servizi per la navigazione fra le viste
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param userService {UserService} servizi relativi agli utenti
   */
  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService) { }

  /**
   * Metodo associato a onRowSelect che permette di modificare i dati di un utente selezionando una qualsiasi riga della tabella
   * @param event {any} evento di selezione di una riga qualsiasi della tabella
   */
  public goToEditUser(event: any) {
    this.router.navigate(["../", "userDetails", event.data.id], { relativeTo: this.activeRoute });
  }

  /**
   * Metodo associato all'icona di riga che permette di modificare i dati di un utente
   * @param id {string} identificativo dell'utente
   */
  public goToEditUserById(id: string) {
    this.router.navigate(["../", "userDetails", id], { relativeTo: this.activeRoute });
  }

  /**Metodo che permette di richiamare il form di creazione di un nuovo utente */
  public goToNewUser() {
    this.router.navigate(["../", "userDetails", "new"], { relativeTo: this.activeRoute });
  }
}
