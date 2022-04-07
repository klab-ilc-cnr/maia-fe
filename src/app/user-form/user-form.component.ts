import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../service/user.service';
import { User } from '../model/user';
import { Roles } from '../model/roles';
import { LoggedUserService } from '../service/logged-user.service';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {

  user: User;

  private editUser = false;
  private newId = 'new';
  public roles = Array<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private loggedUserService : LoggedUserService) {
    this.user = new User();
    
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      var id = params.get('id');

      if (id != this.newId && id != null) {
        this.editUser = true;
        this.loadUser(id);
      }
      else {
        this.user = new User();
        this.user.active = true;
      }
    });

    this.roles = Object.keys(Roles);
  }

  public get canManageUsers(): boolean {
    //return true;
    //return this.authorizationService.canManageUsers();
    return this.loggedUserService.canManageUsers();
  }

  isEditUser () {
    return this.editUser;
  }

  onSubmit() {
    if (this.editUser) {
      console.log(this.user.email, this.user.id, this.user.role, this.user.active)
      this.userService.update(this.user).subscribe(result => this.goToUserList());
    }
    else {
      this.userService.save(this.user).subscribe(result => this.goToUserList());
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
    this.userService
        .retrieveById(id)
        .subscribe(
          data => {
            this.user = data;
        });
  }
}
