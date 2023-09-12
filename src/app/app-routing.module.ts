import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { WorkspaceLayoutComponent } from './layouts/workspace-layout/workspace-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { PROJECTX_ROUTES } from './routes/projectx.routes';
import { WORKSPACES_ROUTES } from './routes/workspaces.routes';

/**Route iniziali */
const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: PROJECTX_ROUTES
    // canActivate: [AuthGuard],
    // canActivateChild: [RoleGuard],
  },
  {
    path: '',
    component: WorkspaceLayoutComponent,
    children: WORKSPACES_ROUTES
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
