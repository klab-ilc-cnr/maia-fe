import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../service/user.service';
import { User } from '../model/user';
import {Roles} from '../model/roles'

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {

  user: User;

  public roles = Array<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService) {
    this.user = new User();
  }
  ngOnInit(): void {
    this.roles=Object.keys(Roles);
  }

  onSubmit() {
    this.userService.save(this.user).subscribe(result => this.gotoUserList());
  }

  gotoUserList() {
    this.router.navigate(['usersManagement/users']);
  }

  onRoleChanged(event: any) {
    console.log("selected value", 
    event.target.value);
    this.user.role = event.target.value;
    this.user.active = true;
  }
}
