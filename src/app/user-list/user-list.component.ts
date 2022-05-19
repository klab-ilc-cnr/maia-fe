import { Component, OnInit, ViewChild } from '@angular/core';
import { Roles } from '../model/roles'
import { Table } from 'primeng/table';
import { User } from '../model/user';
import { UserService } from '../services/user.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  @ViewChild('dt') public dt: Table | undefined

  public roleOptions = Array<string>();
  public users = new Array<User>();

  constructor(private router: Router,
              private activeRoute: ActivatedRoute,
              private userService: UserService) {
  }

  ngOnInit() {
    this.userService.findAll().subscribe(data => {
      this.users = data;
    });

    this.roleOptions = Object.keys(Roles);
  }

  public goToEditUser(event: any) {
    this.router.navigate(["../", "userDetails", event.data.id], { relativeTo: this.activeRoute });
  }

  public goToEditUserById(id: string) {
    this.router.navigate(["../", "userDetails", id], { relativeTo: this.activeRoute });
  }

  public goToNewUser() {
    this.router.navigate(["../", "userDetails", "new"], { relativeTo: this.activeRoute });
  }
}
