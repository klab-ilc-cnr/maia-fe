import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PageControllersModule } from './controllers/page-controllers/page-controllers.module';

import { ConfirmationService, MessageService } from 'primeng/api';
import { BaseMetadataEditorComponent } from './controllers/editors/base-metadata-editor/base-metadata-editor.component';
import { FormCoreEditorComponent } from './controllers/editors/form-core-editor/form-core-editor.component';
import { FormMetadataEditorComponent } from './controllers/editors/form-metadata-editor/form-metadata-editor.component';
import { LexEntryEditorComponent } from './controllers/editors/lex-entry-editor/lex-entry-editor.component';
import { LexEntryMetadataEditorComponent } from './controllers/editors/lex-entry-metadata-editor/lex-entry-metadata-editor.component';
import { LexicalEntryEditorComponent } from './controllers/editors/lexical-entry-editor/lexical-entry-editor.component';
import { RelationEditorComponent } from './controllers/editors/relation-editor/relation-editor.component';
import { SemanticRelEditorComponent } from './controllers/editors/semantic-rel-editor/semantic-rel-editor.component';
import { SemanticRelInputComponent } from './controllers/editors/semantic-rel-editor/semantic-rel-input/semantic-rel-input.component';
import { SenseCoreEditorComponent } from './controllers/editors/sense-core-editor/sense-core-editor.component';
import { SenseMetadataEditorComponent } from './controllers/editors/sense-metadata-editor/sense-metadata-editor.component';
import { TextAnnotationEditorComponent } from './controllers/editors/text-annotation-editor/text-annotation-editor.component';
import { IconsModule } from './controllers/icons/icons.module';
import { TabsFormComponent } from './controllers/tab-controllers/tabs-form/tabs-form.component';
import { TabsLexicalEntryComponent } from './controllers/tab-controllers/tabs-lexical-entry/tabs-lexical-entry.component';
import { TabsSenseComponent } from './controllers/tab-controllers/tabs-sense/tabs-sense.component';
import { httpInterceptorProviders } from './interceptors/authentication.interceptor';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { WorkspaceLayoutComponent } from './layouts/workspace-layout/workspace-layout.component';
import { SharedModule } from './modules/shared.module';
import { LoginComponent } from './pages/login/login.component';
import { WorkspaceCorpusExplorerComponent } from './pages/workspace/workspace-corpus-explorer/workspace-corpus-explorer.component';
import { WorkspaceLexiconEditTileComponent } from './pages/workspace/workspace-lexicon-edit-tile/workspace-lexicon-edit-tile.component';
import { WorkspaceLexiconTileComponent } from './pages/workspace/workspace-lexicon-tile/workspace-lexicon-tile.component';
import { WorkspaceListComponent } from './pages/workspace/workspace-list/workspace-list.component';
import { WorkspaceMenuComponent } from './pages/workspace/workspace-menu/workspace-menu.component';
import { WorkspaceTextSelectorComponent } from './pages/workspace/workspace-text-selector/workspace-text-selector.component';
import { WorkspaceTextWindowComponent } from './pages/workspace/workspace-text-window/workspace-text-window.component';
import { WorkspaceComponent } from './pages/workspace/workspace.component';
import { PendingChangesGuard } from './pending-changes-guard';
import { CommonService } from './services/common.service';
import { MatchNewPasswordDirective } from './validators/match-new-password.directive';

@NgModule({
  declarations: [
    AppComponent,
    WorkspaceComponent,
    WorkspaceListComponent,
    WorkspaceLayoutComponent,
    WorkspaceMenuComponent,
    WorkspaceTextSelectorComponent,
    WorkspaceCorpusExplorerComponent,
    MainLayoutComponent,
    WorkspaceTextWindowComponent,
    RelationEditorComponent,
    WorkspaceLexiconTileComponent,
    WorkspaceLexiconEditTileComponent,
    LexicalEntryEditorComponent,
    TabsLexicalEntryComponent,
    TabsFormComponent,
    TabsSenseComponent,
    LexEntryMetadataEditorComponent,
    FormMetadataEditorComponent,
    SenseMetadataEditorComponent,
    BaseMetadataEditorComponent,
    LexEntryEditorComponent,
    FormCoreEditorComponent,
    SenseCoreEditorComponent,
    SemanticRelEditorComponent,
    SemanticRelInputComponent,
    TextAnnotationEditorComponent,
    LoginComponent,
    MatchNewPasswordDirective,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    NgbModule,
    PageControllersModule,
    FontAwesomeModule,
    IconsModule,
    SharedModule
  ],
  providers: [PendingChangesGuard, MessageService, ConfirmationService, CommonService, httpInterceptorProviders],
  bootstrap: [AppComponent]
})
export class AppModule {
}
