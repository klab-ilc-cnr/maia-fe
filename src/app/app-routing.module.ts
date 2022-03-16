import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from "./user-list/user-list.component";
import { UserFormComponent } from "./user-form/user-form.component";
import { LayoutComponent } from './layout/layout.component';
import { PROJECTX_ROUTES } from './routes/projectx.routes'

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: PROJECTX_ROUTES
    // canActivate: [AuthGuard],
    // canActivateChild: [RoleGuard],
  }
  // { path: 'users', component: UserListComponent },
  // { path: 'adduser', component: UserFormComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true, scrollOffset: [0, 0], scrollPositionRestoration: 'enabled', relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule {
  public static readonly routes: Routes = routes;
}
