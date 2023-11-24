import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Observable, Subject, catchError, take, takeUntil, throwError } from 'rxjs';
import { Language } from 'src/app/models/language';
import { Roles } from 'src/app/models/roles';
import { User } from 'src/app/models/user';
import { LanguageService } from 'src/app/services/language.service';
import { LoaderService } from 'src/app/services/loader.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserService } from 'src/app/services/user.service';
import { matchNewPassword } from 'src/app/validators/match-new-password.directive';
import { nameDuplicateValidator } from 'src/app/validators/not-duplicate-name.directive';

/**Componente del form dei dati di un utente (anche nuovo) */
@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  userForm = new FormGroup({
    username: new FormControl<string>('', [Validators.required, Validators.minLength(4)]),
    newPassword: new FormControl<string>(''),
    confirmPassword: new FormControl<string>(''),
    name: new FormControl<string>('', Validators.required),
    surname: new FormControl<string>('', Validators.required),
    email: new FormControl<string>(''),
    role: new FormControl<string>('', Validators.required),
    active: new FormControl<boolean>(false),
    languages: new FormControl<Language[]>([], Validators.required),
  });
  get username() { return this.userForm.controls.username }
  get userPwd() { return this.userForm.controls.newPassword }
  get confirmPwd() { return this.userForm.controls.confirmPassword }
  get name() { return this.userForm.controls.name }
  get surname() { return this.userForm.controls.surname }
  get email() { return this.userForm.controls.email }
  get role() { return this.userForm.controls.role }
  get languages() { return this.userForm.controls.languages }

  passwordForm = new FormGroup({
    oldPassword: new FormControl<string>('', Validators.required),
    newPassword: new FormControl<string>('', Validators.required),
    confirmPassword: new FormControl<string>('', Validators.required),
  }, {
    validators: matchNewPassword
  });

  get oldPassword() { return this.passwordForm.controls.oldPassword as FormControl; }
  get newPassword() { return this.passwordForm.controls.newPassword as FormControl; }
  get confirmPassword() { return this.passwordForm.controls.confirmPassword as FormControl; }

  /**Utente in lavorazione */
  user: User;
  currentMaiaUserId = this.storageService.getCurrentUser()?.id;
  isSameUser = false;

  /**Definisce se è un utente in modifica */
  private editUser = false;
  /**Definisce se è un utente in creazione */
  private newUser = false;
  private currentUser = false;
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
    private languageService: LanguageService,
    private storageService: StorageService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) {
    this.user = new User(); //crea un nuovo utente
  }

  /**Metodo dell'interfaccia OnInit nel quale si recuperano i valori iniziali del componente */
  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(params => {
      const id = params.get('id'); //recupero l'id utente dall'url di navigazione 
      this.isSameUser = id == this.currentMaiaUserId?.toString();

      if (id === this.newId) //caso di un nuovo inserimento utente
      {
        this.userForm.get('newPassword')?.setValidators(Validators.required);
        this.userForm.get('confirmPassword')?.setValidators(Validators.required);
        this.userForm.setValidators(matchNewPassword);
        this.userForm.reset();
        this.addDuplicateValidator();
        this.newUser = true;
        return;
      }

      if ((id != null && id != undefined) && !this.isSameUser) { //caso di indicazione di un id utente (diverso da quello loggato) da modificare
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
    // return false; //TODO A SOLO USO DEI TEST
  }

  /**
   * Getter dell'essere utente in modifica
   * @returns {boolean} definisce se è un utente in modifica
   */
  public get isEditUser() { return this.editUser; }

  /**
   * Getter dell'essere un inserimento di nuovo utente
   * @returns {boolean} definisce se è un nuovo utente
   */
  public get isNewUser() { return this.newUser; }

  public get isCurrentUser() { return this.currentUser; }

  /**Metodo che procede alla creazione del nuovo utente o al salvataggio delle modifiche dell'utente selezionato */
  onSubmitUser() {  //BUG new user service return an error, opened an issue on BE repo, edit user is working
    const updatedUser = <User>{
      ...this.user,
      ...{
        username: this.username.value!,
        name: this.name.value!,
        surname: this.surname.value!,
        email: this.email.value!,
        role: this.role.value!,
        active: this.userForm.get('active')?.value,
        languages: this.languages.value,
      }
    };
    this.loaderService.show();
    if (this.isNewUser) {
      this.userService.save(updatedUser).pipe(
        takeUntil(this.unsubscribe$),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.message));
          this.loaderService.hide();
          return throwError(() => new Error(error.error));
        }),
      ).subscribe(newUser => {
        const userId = +newUser.id!;
        this.userService.updatePassword({ id: userId, newPassword: this.userPwd.value! }).pipe(
          takeUntil(this.unsubscribe$),
          catchError((error: HttpErrorResponse) => {
            this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.message));
            return throwError(() => new Error(error.error));
          }),
        ).subscribe(() => {
          this.messageService.add(this.msgConfService.generateSuccessMessageConfig('User successfully updated'));
          this.goToUserList();
          this.loaderService.hide();
        });
      });
    } else {
      this.userService.update(updatedUser).pipe(
        takeUntil(this.unsubscribe$),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.message));
          this.loaderService.hide();
          return throwError(() => new Error(error.error));
        }),
      ).subscribe(() => {
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig('User successfully updated'));
        this.goToUserList();
        this.loaderService.hide();
      });
    }
  }

  onSubmitPwd() {
    const pwdBody: { id?: number, newPassword: string, currentPassword?: string } = { newPassword: this.newPassword?.value };
    if (!this.isSameUser) {
      pwdBody.id = +this.user.id!;
    }
    if (!this.canManageUsers || this.isSameUser) {
      pwdBody.currentPassword = this.oldPassword?.value;
    }
    this.userService.updatePassword(pwdBody).pipe(
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.message));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(() => {
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Password successfully updated'));
    });
  }

  /**Metodo che naviga sul componente della lista utenti */
  goToUserList() {
    this.router.navigate(['usersManagement/users']);
  }

  private addDuplicateValidator() {
    this.userService.findAll().pipe(
      take(1),
    ).subscribe(users => {
      const usersName = users.map(u => u.username!);
      this.username.addValidators(nameDuplicateValidator(usersName));
    });
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
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.message));
        this.loaderService.hide();
        return throwError(() => new Error(error.error));
      }),
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
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.message));
        this.loaderService.hide();
        return throwError(() => new Error(error.error));
      }),
    ).subscribe((data) => {
      this.user = data;
      this.setFormInitialValue();
      this.loaderService.hide();
    });
  }

  private setFormInitialValue() {
    this.userForm.setValue({
      username: this.user.username ?? '',
      newPassword: '',
      confirmPassword: '',
      name: this.user.name ?? '',
      surname: this.user.surname ?? '',
      email: this.user.email ?? '',
      role: this.user.role ?? '',
      active: this.user.active ?? false,
      languages: this.user.languages ?? [],
    });
    if (!this.isNewUser) {
      this.userForm.controls.username.disable(); //username must be unique 
    }
    if (!this.canManageUsers && this.user.id != this.currentMaiaUserId) {
      this.userForm.disable();
    }
  }
}
