import { HttpErrorResponse } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { catchError, take } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { CommonService } from 'src/app/services/common.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
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
  /**Reference to item deletion popup */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

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
    private userService: UserService,
    private utility: CommonService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) { }

  private delete = (id: number): void => {
    this.userService.deleteUser(id).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.utility.throwHttpErrorAndMessage(error,error.message)),
    ).subscribe(()=>{
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(this.utility.translateKey('USERS_MANAGER.userDeleted')));
      this.users = this.userService.findAll();
    });
  }

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

  public onRemoveUser(userName: string, userId: number) {
    const confirmMsg = `You are about to delete the user "${userName}"`;
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(userId!), userId, userName);

  }
}
