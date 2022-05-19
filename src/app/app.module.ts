import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UserListComponent } from './user-list/user-list.component';
import { UserFormComponent } from './user-form/user-form.component';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from '@angular/common/http';
import { UserService } from './services/user.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthConfigModule } from './config/auth.config.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LayoutComponent } from './layout/layout.component';
import { PageControllersModule } from './page-controllers/page-controllers.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ButtonModule } from "primeng/button";
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from "primeng/table";
import { ListboxModule } from 'primeng/listbox';
import { WorkspaceComponent } from './workspace/workspace.component';
import { WorkspaceListComponent } from './workspace-list/workspace-list.component';
import { WorkspaceLayoutComponent } from './workspace-layout/workspace-layout.component';
import { PendingChangesGuard } from './pending-changes-guard';
import { WorkspaceMenuComponent } from './workspace-menu/workspace-menu.component';
// import { OAuthModule } from 'angular-oauth2-oidc';
// import { AuthModule } from './auth/auth.module';
import { MenubarModule } from 'primeng/menubar';
import { WorkspaceTextSelectorComponent } from './workspace-text-selector/workspace-text-selector.component';

@NgModule({
  declarations: [
    AppComponent,
    UserListComponent,
    UserFormComponent,
    LayoutComponent,
    WorkspaceComponent,
    WorkspaceListComponent,
    WorkspaceLayoutComponent,
    WorkspaceMenuComponent,
    WorkspaceTextSelectorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    AuthConfigModule,
    NgbModule,
    PageControllersModule,
    FontAwesomeModule,
    ButtonModule,
    TableModule,
    ReactiveFormsModule,
    MultiSelectModule,
    DropdownModule,
    InputSwitchModule,
    ListboxModule,
    MenubarModule
  ],
  providers: [PendingChangesGuard],
  bootstrap: [AppComponent]
})
export class AppModule {
}
