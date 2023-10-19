import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Language } from 'src/app/models/language';
import { Roles } from 'src/app/models/roles';
import { User } from 'src/app/models/user';
import { LanguageService } from 'src/app/services/language.service';
import { LoaderService } from 'src/app/services/loader.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { UserService } from 'src/app/services/user.service';

/**Componente del form dei dati di un utente (anche nuovo) */
@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  userForm = new FormGroup({
    username: new FormControl<string>('', Validators.required),
    name: new FormControl<string>('', Validators.required),
    surname: new FormControl<string>('', Validators.required),
    email: new FormControl<string>('', Validators.required),
    role: new FormControl<string>('', Validators.required),
    active: new FormControl<boolean>(false),
    languages: new FormControl<Language[]>([], Validators.required),
  });
  get username() { return this.userForm.controls.username }
  get name() { return this.userForm.controls.name }
  get surname() { return this.userForm.controls.surname }
  get email() { return this.userForm.controls.email }
  get role() { return this.userForm.controls.role }
  get languages() { return this.userForm.controls.languages }

  /**Utente in lavorazione */
  user: User;

  /**Definisce se è un utente in modifica */
  private editUser = false;
  /**Definisce se è un utente in creazione */
  private newUser = false;
  /**Identificativo per l'inserimento di un nuovo utente */
  private newId = 'new';
  /**Lista dei ruoli utente */
  public roles = Object.keys(Roles);
  /**Lista delle lingue che possono essere associate a un utente */
  public languages$ = this.languageService.retrieveAll();

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
    private loggedUserService: LoggedUserService,
    private languageService: LanguageService) {
    this.user = new User(); //crea un nuovo utente
  }

  /**Metodo dell'interfaccia OnInit nel quale si recuperano i valori iniziali del componente */
  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(params => {
      const id = params.get('id'); //recupero l'id utente dall'url di navigazione 

      if (id === this.newId) //caso di un nuovo inserimento utente
      {
        this.userForm.reset();
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
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**Definisce se l'utente loggato può modificare i dati utente */
  public get canManageUsers(): boolean {
    return this.loggedUserService.canManageUsers();
  }

  /**
   * Getter dell'essere utente in modifica
   * @returns {boolean} definisce se è un utente in modifica
   */
  public get isEditUser() {
    return this.editUser;
  }

  /**
   * Getter dell'essere un inserimento di nuovo utente
   * @returns {boolean} definisce se è un nuovo utente
   */
  public get isNewUser() {
    return this.newUser;
  }

  /**Metodo che procede alla creazione del nuovo utente o al salvataggio delle modifiche dell'utente selezionato */
  onSubmit() {
    const updatedUser = <User>{
      ...this.user,
      ...this.userForm.value
    };
    this.loaderService.show();
    let submitObs: Observable<User>;
    if (this.editUser) { //caso dell'utente modificato
      submitObs = this.userService.update(updatedUser);
    }
    else { //casp inserimento di un nuovo utente
      submitObs = this.userService.save(updatedUser);
    }
    submitObs.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(() => {
      this.goToUserList();
      this.loaderService.hide();
    })
  }

  /**Metodo che naviga sul componente della lista utenti */
  goToUserList() {
    this.router.navigate(['usersManagement/users']);
  }

  /**
   * Metodo privato che recupera i dati di un utente utilizzando il suo id
   * @param id {string} identificativo dell'utente
   * @returns {void}
   */
  private loadUser(id: string): void {
    if (!id) { //caso di id assente //TODO valutare rimozione, rischia di essere ridondante
      return;
    }

    this.loaderService.show();
    this.userService.retrieveById(id).pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((data) => {
      this.user = data;
      this.setFormInitialValue();
      this.loaderService.hide();
    });
  }

  /**Metodo che richiama le informazioni dell'utente loggato */
  private loadCurrentUserProfile(): void {
    this.loaderService.show();
    this.userService.retrieveCurrentUser().pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((data) => {
      this.user = data;
      this.setFormInitialValue();
      this.loaderService.hide();
    });
  }

  private setFormInitialValue() {
    this.userForm.setValue({
      username: this.user.username ?? '',
      name: this.user.name ?? '',
      surname: this.user.surname ?? '',
      email: this.user.email ?? '',
      role: this.user.role ?? '',
      active: this.user.active ?? false,
      languages: this.user.languages ?? [],
    });
    if (!this.isNewUser) {
      this.userForm.controls.email.disable();
    }
    if (!this.canManageUsers) {
      this.userForm.disable();
    }
  }
}
