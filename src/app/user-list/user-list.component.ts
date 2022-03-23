import { Component, OnInit, ViewChild } from '@angular/core';
import { Roles } from '../model/roles'
import { Table } from 'primeng/table';
import { User } from '../model/user';
import { UserService } from '../service/user.service';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  @ViewChild('dt') public dt: Table | undefined

  public roleOptions = Array<string>();
  public users = new Array<User>();

  constructor(private userService: UserService) {
  }

  ngOnInit() {
    this.userService.findAll().subscribe(data => {
      this.users = data;
    });
    this.roleOptions = Object.keys(Roles);
  }
}
