import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpClient, HttpClientModule } from '@angular/common/http';
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
import { LexSenseDirectRelationsComponent } from './controllers/editors/lex-sense-relations-editor/lex-sense-direct-relations/lex-sense-direct-relations.component';
import { LexSenseIndirectRelationsComponent } from './controllers/editors/lex-sense-relations-editor/lex-sense-indirect-relations/lex-sense-indirect-relations.component';
import { LexSenseRelationsEditorComponent } from './controllers/editors/lex-sense-relations-editor/lex-sense-relations-editor.component';
import { LexicalEntryEditorComponent } from './controllers/editors/lexical-entry-editor/lexical-entry-editor.component';
import { RelationEditorComponent } from './controllers/editors/relation-editor/relation-editor.component';

import { LexEntityIndirectRelPropertyComponent } from './controllers/editors/lex-entity-relations/lex-entity-semantic-rel-indirect/lex-entity-indirect-rel-property/lex-entity-indirect-rel-property.component';
import { LexEntitySemanticRelIndirectComponent } from './controllers/editors/lex-entity-relations/lex-entity-semantic-rel-indirect/lex-entity-semantic-rel-indirect.component';
import { LexEntitySemanticRelComponent } from './controllers/editors/lex-entity-relations/lex-entity-semantic-rel/lex-entity-semantic-rel.component';
import { LexEntryDirectRelationsComponent } from './controllers/editors/lex-entry-relations-editor/lex-entry-direct-relations/lex-entry-direct-relations.component';
import { LexEntryIndirectRelationsComponent } from './controllers/editors/lex-entry-relations-editor/lex-entry-indirect-relations/lex-entry-indirect-relations.component';
import { LexEntryRelationsEditorComponent } from './controllers/editors/lex-entry-relations-editor/lex-entry-relations-editor.component';

import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
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
import { NewDictionaryEntryComponent } from './pages/workspace/workspace-dictionary-tile/new-dictionary-entry/new-dictionary-entry.component';
import { WorkspaceDictionaryTileComponent } from './pages/workspace/workspace-dictionary-tile/workspace-dictionary-tile.component';
import { WorkspaceLexiconEditTileComponent } from './pages/workspace/workspace-lexicon-edit-tile/workspace-lexicon-edit-tile.component';
import { WorkspaceLexiconTileComponent } from './pages/workspace/workspace-lexicon-tile/workspace-lexicon-tile.component';
import { WorkspaceListComponent } from './pages/workspace/workspace-list/workspace-list.component';
import { WorkspaceMenuComponent } from './pages/workspace/workspace-menu/workspace-menu.component';
import { WorkspaceSearchTileComponent } from './pages/workspace/workspace-search-tile/workspace-search-tile.component';
import { WorkspaceTextSelectorComponent } from './pages/workspace/workspace-text-selector/workspace-text-selector.component';
import { WorkspaceTextWindowComponent } from './pages/workspace/workspace-text-window/workspace-text-window.component';
import { WorkspaceComponent } from './pages/workspace/workspace.component';
import { PendingChangesGuard } from './pending-changes-guard';
import { CommonService } from './services/common.service';
import { MatchNewPasswordDirective } from './validators/match-new-password.directive';
import { WorkspaceDictionaryEditorTileComponent } from './pages/workspace/workspace-dictionary-editor-tile/workspace-dictionary-editor-tile.component';
import { DictionaryEntryReferralEditorComponent } from './controllers/editors/dictionary-entry-referral-editor/dictionary-entry-referral-editor.component';
import { DictionaryEntryFullEditorComponent } from './controllers/editors/dictionary-entry-full-editor/dictionary-entry-full-editor.component';
import { DropdownPlusNumberComponent } from './forms/dropdown-plus-number/dropdown-plus-number.component';
import { DictionarySortingEditorComponent } from './controllers/editors/dictionary-sorting-editor/dictionary-sorting-editor.component';

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
    LexSenseRelationsEditorComponent,
    LexSenseDirectRelationsComponent,
    LexSenseIndirectRelationsComponent,
    LexEntryRelationsEditorComponent,
    LexEntitySemanticRelComponent,
    LexEntitySemanticRelIndirectComponent,
    LexEntryDirectRelationsComponent,
    LexEntryIndirectRelationsComponent,
    LexEntityIndirectRelPropertyComponent,
    TextAnnotationEditorComponent,
    LoginComponent,
    MatchNewPasswordDirective,
    WorkspaceSearchTileComponent,
    WorkspaceDictionaryTileComponent,
    NewDictionaryEntryComponent,
    WorkspaceDictionaryEditorTileComponent,
    DictionaryEntryReferralEditorComponent,
    DictionaryEntryFullEditorComponent,
    DropdownPlusNumberComponent,
    DictionarySortingEditorComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
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

/**
 * Function to manage translation dependency
 * @param httpClient {HttpClient} Performs HTTP requests
 * @returns {TranslateHttpLoader}
 */
export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, 'assets/i18n/', '.json');
}