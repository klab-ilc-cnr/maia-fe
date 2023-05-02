import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserListComponent } from 'src/app/pages/usersManagement/user-list/user-list.component';
import { UserFormComponent } from 'src/app/pages/usersManagement/user-form/user-form.component';
import { RouterModule } from '@angular/router';
import { USERSMANAGEMENT_ROUTES } from 'src/app/routes/usersmanagement.routes';
import { SharedModule } from './shared.module';



@NgModule({
  declarations: [
    UserListComponent,
    UserFormComponent
  ],
  imports: [
    // CommonModule,
    // FormsModule,
    SharedModule,
    RouterModule.forChild(USERSMANAGEMENT_ROUTES)
  ]
})
export class UsersManagementModule { }
