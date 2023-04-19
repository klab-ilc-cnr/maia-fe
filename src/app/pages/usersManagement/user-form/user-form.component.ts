import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user';
import { Roles } from 'src/app/models/roles';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { NgForm } from '@angular/forms';
import { LanguageService } from 'src/app/services/language.service';
import { Language } from 'src/app/models/language';
import { LoaderService } from 'src/app/services/loader.service';

/**Componente del form dei dati di un utente (anche nuovo) */
@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {

  /**Riferimento al form dei dati utente */
  @ViewChild('userDetailsForm', { static: true }) userDetailsForm: NgForm | undefined;

  /**Utente in lavorazione */
  user: User;

  /**Definisce se è un utente in modifica */
  private editUser = false;
  /**Definisce se è un utente in creazione */
  private newUser = false;
  /**Identificativo per l'inserimento di un nuovo utente */
  private newId = 'new';
  /**Lista dei ruoli utente */
  public roles = Array<string>();
  /**Lista delle lingue che possono essere associate a un utente */
  public languages = Array<Language>();

  /**
   * Costruttore per UserFormComponent
   * @param route {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param router {Router} servizi per la navigazione fra le viste
   * @param loaderService {LoaderService} servizi per la gestione del segnale di caricamento
   * @param userService {UserService} servizi relativi agli utenti
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato
   * @param languageService {LanguageService} servizi relativi alla gestione delle lingue
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loaderService: LoaderService,
    private userService: UserService,
    private loggedUserService : LoggedUserService,
    private languageService : LanguageService) {
    this.user = new User(); //crea un nuovo utente

  }

  /**Metodo dell'interfaccia OnInit nel quale si recuperano i valori iniziali del componente */
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {

      var id = params.get('id'); //recupero l'id utente dall'url di navigazione 

      if(id === this.newId) //caso di un nuovo inserimento utente
      {
        this.userDetailsForm?.reset();
        this.newUser = true;
        return;
      }

      if (id != null && id != undefined) { //caso di indicazione di un id utente da modificare
        this.editUser = true;
        this.loadUser(id);
        return;
      }

      this.editUser = false;
      this.loadCurrentUserProfile();

    });

    this.roles = Object.keys(Roles);

    this.loaderService.show();
    this.languageService.retrieveAll()
    .subscribe({
      next: (result) => {
        this.languages = result;
        this.loaderService.hide();
      }
    })
  }

  /**Definisce se l'utente loggato può modificare i dati utente */
  public get canManageUsers(): boolean {
    return this.loggedUserService.canManageUsers();
  }

  /**
   * Getter dell'essere utente in modifica
   * @returns {boolean} definisce se è un utente in modifica
   */
  isEditUser () {
    return this.editUser;
  }

  /**
   * Getter dell'essere un inserimento di nuovo utente
   * @returns {boolean} definisce se è un nuovo utente
   */
  isNewUser () {
    return this.newUser;
  }

  /**Metodo che procede alla creazione del nuovo utente o al salvataggio delle modifiche dell'utente selezionato */
  onSubmit() {
    this.loaderService.show();
    if (this.editUser) { //caso dell'utente modificato
      console.log(this.user.email, this.user.id, this.user.role, this.user.active)
      this.userService.update(this.user).subscribe({
        next: (result) => {
          this.goToUserList();
          this.loaderService.hide();
        }
      });
    }
    else { //casp inserimento di un nuovo utente
      this.userService.save(this.user).subscribe({
        next: (result) => {
          this.goToUserList();
          this.loaderService.hide();
        }
      });
    }
  }

  /**Metodo che naviga sul componente della lista utenti */
  goToUserList() {
    this.router.navigate(['usersManagement/users']);
  }

  /**
   * Metodo che al cambiamento della selezione nella dropdown dei ruoli aggiorna il ruolo dell'utente in lavorazione e lo pone in stato attivo
   * @param event {any} evento di cambiamento della selezione sulla dropdown dei ruoli
   */
  onRoleChanged(event: any) {
    console.log("selected value", event.target.value, this.user.active);
    this.user.role = event.target.value;
    this.user.active = true;
  }

  /**
   * Metodo privato che recupera i dati di un utente utilizzando il suo id
   * @param id {string} identificativo dell'utente
   * @returns {void}
   */
  private loadUser(id: string): void {
    if(!id) { //caso di id assente
      return;
    }

    this.loaderService.show();
    this.userService
        .retrieveById(id)
        .subscribe({
          next: (data) => {
            this.user = data;
            this.loaderService.hide();
          }
        });
  }

  /**Metodo che richiama le informazioni dell'utente loggato */
  private loadCurrentUserProfile(): void {
    this.loaderService.show();
    this.userService
        .retrieveCurrentUser()
        .subscribe({
          next: (data) => {
            this.user = data;
            this.loaderService.hide();
          }
        });
  }
}
