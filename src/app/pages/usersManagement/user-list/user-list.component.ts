import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Table } from 'primeng/table';
import { UserService } from 'src/app/services/user.service';

/**Component of the user data table */
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent {

  /**Reference to the display table */
  @ViewChild('dt') public dt: Table | undefined

  /**Observable of the user list */
  public users = this.userService.findAll();

  /**
   * Costructor for UserListComponent
   * @param router {Router} A service that provides navigation among views and URL manipulation capabilities
   * @param activeRoute {ActivatedRoute} Provides access to information about a route associated with a component that is loaded in an outlet
   * @param userService {UserService} user-related services
   */
  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService) { }

  /**
   * Method associated with onRowSelect that allows changing a user's data by selecting any row in the table
   * @param event {any} event of selecting any row in the table
   */
  public goToEditUser(event: any) {
    this.router.navigate(["../", "userDetails", event.data.id], { relativeTo: this.activeRoute });
  }

  //TODO Merge the methods goToEditUser and goToEditUserById

  /**
   * Method associated with the row icon that allows editing of a user's data
   * @param id {string} user ID
   */
  public goToEditUserById(id: string) {
    this.router.navigate(["../", "userDetails", id], { relativeTo: this.activeRoute });
  }

  /**Method that allows you to invoke the form for creating a new user */
  public goToNewUser() {
    this.router.navigate(["../", "userDetails", "new"], { relativeTo: this.activeRoute });
  }
}
