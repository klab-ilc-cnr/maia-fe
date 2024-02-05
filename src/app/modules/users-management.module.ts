import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UserFormComponent } from 'src/app/pages/usersManagement/user-form/user-form.component';
import { UserListComponent } from 'src/app/pages/usersManagement/user-list/user-list.component';
import { USERSMANAGEMENT_ROUTES } from 'src/app/routes/usersmanagement.routes';
import { SharedModule } from './shared.module';



@NgModule({
  declarations: [
    UserListComponent,
    UserFormComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(USERSMANAGEMENT_ROUTES)
  ]
})
export class UsersManagementModule { }
