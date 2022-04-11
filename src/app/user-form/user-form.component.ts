import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../service/user.service';
import { User } from '../model/user';
import { Roles } from '../model/roles';
import { LoggedUserService } from '../service/logged-user.service';
import { NgForm } from '@angular/forms';
import { LanguageService } from '../service/language.service';
import { Language } from '../model/language';

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
    
    this.languageService.retrieveAll()
    .subscribe(
      result => {
        this.languages = result;
      }
    )
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
    if (this.editUser) {
      console.log(this.user.email, this.user.id, this.user.role, this.user.active)
      this.userService.update(this.user).subscribe(
        result => this.goToUserList());
    }
    else {
      this.userService.save(this.user).subscribe(
        result => this.goToUserList());
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
    if(id)
    this.userService
        .retrieveById(id)
        .subscribe(
          data => {
            this.user = data;
        });
  }

  private loadCurrentUserProfile(): void {
    this.userService
        .retrieveCurrentUser()
        .subscribe(
          data => {
            this.user = data;
        });
  }
}
