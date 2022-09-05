import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/model/user';
import { Roles } from 'src/app/model/roles';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { NgForm } from '@angular/forms';
import { LanguageService } from 'src/app/services/language.service';
import { Language } from 'src/app/model/language';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {

  @ViewChild('userDetailsForm', { static: true }) userDetailsForm: NgForm | undefined;

  user: User;

  private editUser = false;
  private newUser = false;
  private newId = 'new';
  public roles = Array<string>();
  public languages = Array<Language>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loaderService: LoaderService,
    private userService: UserService,
    private loggedUserService : LoggedUserService,
    private languageService : LanguageService) {
    this.user = new User();

  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {

      var id = params.get('id');

      if(id === this.newId)
      {
        this.userDetailsForm?.reset();
        this.newUser = true;
        return;
      }

      if (id != null && id != undefined) {
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

  public get canManageUsers(): boolean {
    return this.loggedUserService.canManageUsers();
  }

  isEditUser () {
    return this.editUser;
  }

  isNewUser () {
    return this.newUser;
  }

  onSubmit() {
    this.loaderService.show();
    if (this.editUser) {
      console.log(this.user.email, this.user.id, this.user.role, this.user.active)
      this.userService.update(this.user).subscribe({
        next: (result) => {
          this.goToUserList();
          this.loaderService.hide();
        }
      });
    }
    else {
      this.userService.save(this.user).subscribe({
        next: (result) => {
          this.goToUserList();
          this.loaderService.hide();
        }
      });
    }
  }

  goToUserList() {
    this.router.navigate(['usersManagement/users']);
  }

  onRoleChanged(event: any) {
    console.log("selected value", event.target.value, this.user.active);
    this.user.role = event.target.value;
    this.user.active = true;
  }

  private loadUser(id: string): void {
    if(!id) {
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
