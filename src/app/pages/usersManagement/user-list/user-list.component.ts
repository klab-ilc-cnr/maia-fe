import { Component, OnInit, ViewChild } from '@angular/core';
import { Roles } from 'src/app/models/roles';
import { Table } from 'primeng/table';
import { User } from 'src/app/models/user';
import { UserService } from 'src/app/services/user.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoaderService } from 'src/app/services/loader.service';

/**Componente della tabella delle anagrafiche utenti */
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  /**Riferimento alla tabella di visualizzazione */
  @ViewChild('dt') public dt: Table | undefined

  /**Lista dei possibili ruoli utente */
  public roleOptions = Array<string>();
  /**Lista degli utenti */
  public users = new Array<User>();

  /**
   * Costruttore per UserListComponent
   * @param router {Router} servizi per la navigazione fra le viste
   * @param loaderService {LoaderService} servizi per la gestione del segnale di caricamento
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param userService {UserService} servizi relativi agli utenti
   */
  constructor(
    private router: Router,
    private loaderService: LoaderService,
    private activeRoute: ActivatedRoute,
    private userService: UserService) { }

  /**Metodo dell'interfaccia OnInit che recupera le informazioni iniziali di visualizzazione */
  ngOnInit() {
    this.loaderService.show(); //mostra il loading
    this.userService.findAll().subscribe({
      next: (data) => {
        this.users = data;
        this.loaderService.hide(); //nasconde il loading
      }
    });

    this.roleOptions = Object.keys(Roles); //recupera la lista di ruoli dalla relativa enum
  }

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
