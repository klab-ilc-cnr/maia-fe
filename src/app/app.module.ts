import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { UserListComponent } from './pages/usersManagement/user-list/user-list.component';
import { UserFormComponent } from './pages/usersManagement/user-form/user-form.component';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from '@angular/common/http';
import { UserService } from './services/user.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthConfigModule } from './config/auth.config.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PageControllersModule } from './controllers/page-controllers/page-controllers.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { ButtonModule } from "primeng/button";
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from "primeng/table";
import { ListboxModule } from 'primeng/listbox';
import { WorkspaceComponent } from './pages/workspace/workspace.component';
import { WorkspaceListComponent } from './pages/workspace/workspace-list/workspace-list.component';
import { WorkspaceLayoutComponent } from './layouts/workspace-layout/workspace-layout.component';
import { PendingChangesGuard } from './pending-changes-guard';
import { WorkspaceMenuComponent } from './pages/workspace/workspace-menu/workspace-menu.component';
// import { OAuthModule } from 'angular-oauth2-oidc';
// import { AuthModule } from './auth/auth.module';
import { MenubarModule } from 'primeng/menubar';
import { WorkspaceTextSelectorComponent } from './pages/workspace/workspace-text-selector/workspace-text-selector.component';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ColorPickerModule } from "primeng/colorpicker";
import { WorkspaceCorpusExplorerComponent } from './pages/workspace/workspace-corpus-explorer/workspace-corpus-explorer.component';
import { TreeModule } from 'primeng/tree';
import { IconsModule } from './controllers/icons/icons.module';
import { TooltipModule } from 'primeng/tooltip';
import { ContextMenuModule } from 'primeng/contextmenu';
import { TreeSelectModule } from 'primeng/treeselect';
import { PopupDeleteItemComponent } from './controllers/popup/popup-delete-item/popup-delete-item.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { WorkspaceTextWindowComponent } from './pages/workspace/workspace-text-window/workspace-text-window.component';
import { AnnotationEditorComponent } from './controllers/editors/annotation-editor/annotation-editor.component';
import { LayersListComponent } from './pages/layers/layers-list/layers-list.component';
import { LayersViewComponent } from './pages/layers/layers-view/layers-view.component';
import { WorkspaceLayersVisibilityManagerComponent } from './pages/workspace/workspace-layers-visibility-manager/workspace-layers-visibility-manager.component';
import { CheckboxModule } from 'primeng/checkbox';
import { TagsetsListComponent } from './pages/tagsets/tagsets-list/tagsets-list.component';
import { TagsetCreateEditComponent } from './pages/tagsets/tagset-create-edit/tagset-create-edit.component';
import { TagsetValueNotDuplicateNameDirective } from './validators/tagset-value-not-duplicate-name.directive';
import { RelationEditorComponent } from './controllers/editors/relation-editor/relation-editor.component';
import { WhitespacesValidatorDirective } from './validators/whitespaces-validator.directive';
import { NotDuplicateNameDirective } from './validators/not-duplicate-name.directive';
import { WorkspaceLexiconTileComponent } from './pages/workspace/workspace-lexicon-tile/workspace-lexicon-tile.component';
import {TreeTableModule} from 'primeng/treetable';

@NgModule({
  declarations: [
    AppComponent,
    UserListComponent,
    UserFormComponent,
    WorkspaceComponent,
    WorkspaceListComponent,
    WorkspaceLayoutComponent,
    WorkspaceMenuComponent,
    WorkspaceTextSelectorComponent,
    WorkspaceCorpusExplorerComponent,
    PopupDeleteItemComponent,
    MainLayoutComponent,
    WorkspaceTextWindowComponent,
    AnnotationEditorComponent,
    LayersListComponent,
    LayersViewComponent,
    WorkspaceLayersVisibilityManagerComponent,
    TagsetsListComponent,
    TagsetCreateEditComponent,
    TagsetValueNotDuplicateNameDirective,
    RelationEditorComponent,
    WhitespacesValidatorDirective,
    NotDuplicateNameDirective,
    WorkspaceLexiconTileComponent
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
    MenubarModule,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    ColorPickerModule,
    TreeModule,
    IconsModule,
    TooltipModule,
    ContextMenuModule,
    TreeSelectModule,
    CheckboxModule,
    TreeTableModule
  ],
  providers: [PendingChangesGuard, MessageService, ConfirmationService],
  bootstrap: [AppComponent]
})
export class AppModule {
}
