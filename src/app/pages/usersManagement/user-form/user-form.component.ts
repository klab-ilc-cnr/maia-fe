import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject, catchError, take, takeUntil, throwError } from 'rxjs';
import { Language } from 'src/app/models/language';
import { User } from 'src/app/models/user';
import { CommonService } from 'src/app/services/common.service';
import { LanguageService } from 'src/app/services/language.service';
import { LoaderService } from 'src/app/services/loader.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserService } from 'src/app/services/user.service';
import { ComponentCanDeactivate } from 'src/app/pending-changes-guard';
import { matchNewPassword } from 'src/app/validators/match-new-password.directive';
import { nameDuplicateValidator } from 'src/app/validators/not-duplicate-name.directive';

/**Edit and create user form component */
@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  standalone: false
})
export class UserFormComponent implements OnInit, OnDestroy, ComponentCanDeactivate {
  /**Subject for subscribe management */
  private readonly unsubscribe$ = new Subject();
  /**User description form */
  userForm = new FormGroup({
    username: new FormControl<string>('', [Validators.required, Validators.minLength(4)]),
    newPassword: new FormControl<string>(''),
    confirmPassword: new FormControl<string>(''),
    name: new FormControl<string>('', Validators.required),
    surname: new FormControl<string>('', Validators.required),
    email: new FormControl<string>('', [Validators.required, Validators.email]),
    role: new FormControl<string>('', Validators.required),
    active: new FormControl<boolean>(false),
    languages: new FormControl<Language[]>([], Validators.required),
  });
  /**Getter for the form username field */
  get username() { return this.userForm.controls.username }
  /**Getter for the form newPassword field */
  get userPwd() { return this.userForm.controls.newPassword }
  /**Getter for the form confirmPassword field */
  get confirmPwd() { return this.userForm.controls.confirmPassword }
  /**Getter for the form name field */
  get name() { return this.userForm.controls.name }
  /**Getter for the form surname field */
  get surname() { return this.userForm.controls.surname }
  /**Getter for the form email field */
  get email() { return this.userForm.controls.email }
  /**Getter for the form role field */
  get role() { return this.userForm.controls.role }
  /**Getter for the form languages field */
  get languages() { return this.userForm.controls.languages }

  /**Change password description form */
  passwordForm = new FormGroup({
    oldPassword: new FormControl<string>('', Validators.required),
    newPassword: new FormControl<string>('', Validators.required),
    confirmPassword: new FormControl<string>('', Validators.required),
  }, {
    validators: matchNewPassword
  });
  /**Getter for the form oldPassword field */
  get oldPassword() { return this.passwordForm.controls.oldPassword as FormControl; }
  /**Getter for the form newPassword field */
  get newPassword() { return this.passwordForm.controls.newPassword as FormControl; }
  /**Getter for the form confirmPassword field */
  get confirmPassword() { return this.passwordForm.controls.confirmPassword as FormControl; }

  /**User in process */
  user: User;
  /**Id of the logged in Maia user */
  currentMaiaUserId = this.storageService.getCurrentUser()?.id;
  /**Defines whether the user being edited is the same as the logged-in user */
  isSameUser = false;

  /**Defines whether it is an editing user */
  private editUser = false;
  /**Defines whether it is a user in creation */
  private newUser = false;
  /**Number of active administrators (null while unknown): the last one cannot be deactivated or demoted */
  private activeAdmins: number | null = null;
  /**Identificativo per l'inserimento di un nuovo utente */
  private newId = 'new';
  /**Lista dei ruoli utente */
  public roles = this.userService.retrieveAllRoles();
  /**Lista delle lingue che possono essere associate a un utente */
  public languages$ = this.languageService.retrieveAll();

  /**
   * Costructor for UserFormComponent
   * @param route {ActivatedRoute} Provides access to information about a route associated with a component that is loaded in an outlet
   * @param router {Router}  A service that provides navigation among views and URL manipulation capabilities
   * @param loaderService {LoaderService} services for the loading element
   * @param userService {UserService} services related to users
   * @param loggedUserService {LoggedUserService} services related to logged user
   * @param languageService {LanguageService} services related to langauge management
   * @param storageService {StorageService} Services to manage the local storage
   * @param messageService {MessageService}
   * @param msgConfService {MessageConfigurationService}
   * @param commonService {CommonService} services related to shared functionality 
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
    private commonService: CommonService,
  ) {
    this.user = new User(); //create a new user
  }

  /**OnInit interface method in which the initial values of the component are retrieved */
  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(params => {
      const id = params.get('id'); //retrieve user id from navigation url
      this.isSameUser = id == this.currentMaiaUserId?.toString();
      this.newUser = false; //the component is reused when the route changes (new -> existing user)
      this.configurePasswordForm();

      if (id === this.newId) //case of a new user entry
      {
        this.userForm.enable();
        this.userForm.get('newPassword')?.setValidators(Validators.required);
        this.userForm.get('confirmPassword')?.setValidators(Validators.required);
        this.userForm.setValidators(matchNewPassword);
        this.userForm.reset();
        this.addDuplicateValidator();
        this.newUser = true;
        return;
      }

      if ((id != null && id != undefined) && !this.isSameUser) { //case of indicating a user id (other than logged in) to be changed
        this.editUser = true;
        this.loadUser(id);
        this.loadActiveAdmins();
        return;
      }

      this.editUser = false;
      this.loadCurrentUserProfile();
      this.loadActiveAdmins();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**Defines whether the logged-in user can edit user data */
  public get canManageUsers(): boolean {
    return this.loggedUserService.canManageUsers();
    // return false; //NOTE ONLY FOR THE PURPOSE OF TESTING
  }

  /**
   * Defines whether it is an editing user
   * @returns {boolean} 
   */
  public get isEditUser(): boolean { return this.editUser; }

  /**
   * Getter for newUser
   * @returns {boolean} defines if it is a new user
   */
  public get isNewUser(): boolean { return this.newUser; }

  /**
   * The old password is asked only to who changes their own password, or is not an administrator:
   * an administrator can set the password of another user without knowing the current one (the backend does not ask for it)
   */
  public get needsOldPassword(): boolean { return !this.canManageUsers || this.isSameUser; }

  /** There are changes not saved yet in the user form */
  public get hasPendingChanges(): boolean { return this.userForm.dirty; }

  /** Names of the mandatory fields still to fill/fix: they are why the Save button is disabled */
  public get blockedFields(): string[] {
    const labels: { [control: string]: string } = {
      username: 'USERS_MANAGER.username', newPassword: 'USERS_MANAGER.password', confirmPassword: 'USERS_MANAGER.confirmPassword',
      name: 'USERS_MANAGER.name', surname: 'USERS_MANAGER.surname', email: 'USERS_MANAGER.email', role: 'USERS_MANAGER.role',
      languages: 'USERS_MANAGER.languages',
    };
    return Object.entries(this.userForm.controls)
      .filter(([, control]) => control.enabled && control.invalid)
      .map(([name]) => this.commonService.translateKey(labels[name]));
  }

  /** The logged-in user can save this form: valid, and (for an existing user) with something changed */
  public get canSave(): boolean {
    const allowed = this.canManageUsers || this.user.id == this.currentMaiaUserId;
    return allowed && this.userForm.valid && (this.isNewUser || this.userForm.dirty);
  }

  /** Why the "active" switch cannot be changed (i18n key), or null if it can */
  public get activeLockReason(): string | null {
    if (!this.canManageUsers) { return null; }
    if (this.isSameUser) { return 'USERS_MANAGER.cannotDeactivateSelf'; }
    return this.isLastActiveAdmin ? 'USERS_MANAGER.lastAdmin' : null;
  }

  /** The user being edited is the only active administrator */
  private get isLastActiveAdmin(): boolean {
    return !this.isNewUser && this.user.role === 'ADMINISTRATOR' && !!this.user.active && this.activeAdmins === 1;
  }

  /** Guard: asks for confirmation before leaving the page with unsaved changes (see PendingChangesGuard) */
  canDeactivate(): boolean { return !this.userForm.dirty; }

  /** Browser warning when the tab is closed/reloaded with unsaved changes */
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.userForm.dirty) { event.preventDefault(); }
  }

  /**Method that proceeds to create the new user or save the changes of the selected user */
  onSubmitUser() {
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
    const successMessage = this.commonService.translateKey('USERS_MANAGER.userUpdated');
    if (this.isNewUser) {
      this.userService.save(updatedUser).pipe(
        takeUntil(this.unsubscribe$),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message));
          this.loaderService.hide();
          return throwError(() => new Error(error.error));
        }),
      ).subscribe(newUser => {
        const userId = +newUser.id!;
        this.userService.updatePassword({ id: userId, newPassword: this.userPwd.value! }).pipe(
          takeUntil(this.unsubscribe$),
          catchError((error: HttpErrorResponse) => {
            // the user exists but has no password: leave the loader and open the user to set it
            this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error?.message ?? error.message));
            this.messageService.add(this.msgConfService.generateWarningMessageConfig(this.commonService.translateKey('USERS_MANAGER.createdNoPassword')));
            this.loaderService.hide();
            this.userForm.markAsPristine();
            this.router.navigate(['usersManagement', 'userDetails', userId]);
            return throwError(() => new Error(error.error));
          }),
        ).subscribe(() => {
          this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMessage));
          this.userForm.markAsPristine();
          this.goToUserList();
          this.loaderService.hide();
        });
      });
    } else {
      this.userService.update(updatedUser).pipe(
        takeUntil(this.unsubscribe$),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message));
          this.loaderService.hide();
          return throwError(() => new Error(error.error));
        }),
      ).subscribe(() => {
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMessage));
        this.userForm.markAsPristine(); //saved: leaving the page must not ask for confirmation
        this.goToUserList();
        this.loaderService.hide();
      });
    }
  }

  /**Method that saves the password change */
  onSubmitPwd() {
    const pwdBody: { id?: number, newPassword: string, currentPassword?: string } = { newPassword: this.newPassword?.value };
    if (!this.isSameUser) {
      pwdBody.id = +this.user.id!;
    }
    if (this.needsOldPassword) {
      pwdBody.currentPassword = this.oldPassword?.value;
    }
    this.userService.updatePassword(pwdBody).pipe(
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(() => {
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(this.commonService.translateKey('USERS_MANAGER.pwdUpdated')));
      this.passwordForm.reset();
    });
  }

  /**Method that navigates the user list component */
  goToUserList() {
    this.router.navigate(['usersManagement/users']);
  }

  /**Method that applies the nameDuplicateValidator validator after retrieving the list of existing usernames */
  private addDuplicateValidator() {
    this.userService.findAll().pipe(
      take(1),
    ).subscribe(users => {
      const usersName = users.map(u => u.username!);
      this.username.addValidators(nameDuplicateValidator(usersName));
    });
  }

  /**
   * Private method that retrieves a user's data using the user's id
   * @param id {string} user ID
   * @returns {void}
   */
  private loadUser(id: string): void {
    if (!id) { //case of absent id //TODO Evaluate removal, risks redundancy
      return;
    }

    this.loaderService.show();
    this.userService.retrieveById(id).pipe(
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message));
        this.loaderService.hide();
        return throwError(() => new Error(error.error));
      }),
    ).subscribe((data) => {
      this.user = data;
      this.setFormInitialValue();
      this.loaderService.hide();
    });
  }

  /**Method that retrieves the information of the logged-in user */
  private loadCurrentUserProfile(): void {
    this.loaderService.show();
    this.userService.retrieveCurrentUser().pipe(
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message));
        this.loaderService.hide();
        return throwError(() => new Error(error.error));
      }),
    ).subscribe((data) => {
      this.user = data;
      this.setFormInitialValue();
      this.loaderService.hide();
    });
  }

  /**Private method that sets the initial value of the user form and evaluates whether it should be disabled in part or in full */
  private setFormInitialValue() {
    this.userForm.enable(); //the form is reused between users: undo the locks of the previous one
    this.configurePasswordForm();
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
    this.userForm.markAsPristine();
    this.userForm.markAsUntouched();
    this.applyLocks();
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); } //show what is missing (e.g. a user without languages)
  }

  /**Locks role and "active" where changing them would be a mistake (own user, last administrator, non administrators) */
  private applyLocks() {
    if (this.isNewUser || !this.user.id) { return; }
    if (!this.canManageUsers && this.user.id != this.currentMaiaUserId) { return; } //the whole form is already disabled
    if (!this.canManageUsers) {
      //a non-administrator cannot change their own role or activation
      this.userForm.controls.role.disable();
      this.userForm.controls.active.disable();
      return;
    }
    if (this.isSameUser || this.isLastActiveAdmin) { this.userForm.controls.active.disable(); }
    if (this.isLastActiveAdmin) { this.userForm.controls.role.disable(); }
  }

  /**Asks the list of users to know how many active administrators there are (the last one must not be deactivated/demoted) */
  private loadActiveAdmins() {
    this.activeAdmins = null;
    this.userService.findAll().pipe(
      take(1),
      takeUntil(this.unsubscribe$),
    ).subscribe({
      next: users => {
        this.activeAdmins = users.filter(u => u.active && u.role === 'ADMINISTRATOR').length;
        this.applyLocks();
      },
      error: (error) => this.commonService.warnBackendErrorOnce('usersList', error),
    });
  }

  /**The old password is mandatory only when it is asked (see needsOldPassword) */
  private configurePasswordForm() {
    const oldPwd = this.passwordForm.controls.oldPassword;
    if (this.needsOldPassword) { oldPwd.setValidators(Validators.required); } else { oldPwd.clearValidators(); }
    oldPwd.updateValueAndValidity();
  }
}
