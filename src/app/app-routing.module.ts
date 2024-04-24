import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { WorkspaceLayoutComponent } from './layouts/workspace-layout/workspace-layout.component';
import { LoginComponent } from './pages/login/login.component';
import { PROJECTX_ROUTES } from './routes/projectx.routes';
import { WORKSPACES_ROUTES } from './routes/workspaces.routes';

/**Initial routes */
const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    children: PROJECTX_ROUTES,
    canActivateChild: [authGuard],
  },
  {
    path: '',
    component: WorkspaceLayoutComponent,
    children: WORKSPACES_ROUTES,
    canActivateChild: [authGuard],
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
