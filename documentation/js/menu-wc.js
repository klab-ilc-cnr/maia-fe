'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">maia-fe documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                        <li class="link">
                            <a href="overview.html" data-type="chapter-link">
                                <span class="icon ion-ios-keypad"></span>Overview
                            </a>
                        </li>
                        <li class="link">
                            <a href="index.html" data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>README
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>
                                <li class="link">
                                    <a href="properties.html" data-type="chapter-link">
                                        <span class="icon ion-ios-apps"></span>Properties
                                    </a>
                                </li>
                    </ul>
                </li>
                    <li class="chapter modules">
                        <a data-type="chapter-link" href="modules.html">
                            <div class="menu-toggler linked" data-toggle="collapse" ${ isNormalMode ?
                                'data-target="#modules-links"' : 'data-target="#xs-modules-links"' }>
                                <span class="icon ion-ios-archive"></span>
                                <span class="link-name">Modules</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                        </a>
                        <ul class="links collapse " ${ isNormalMode ? 'id="modules-links"' : 'id="xs-modules-links"' }>
                            <li class="link">
                                <a href="modules/AppModule.html" data-type="entity-link" >AppModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' : 'data-target="#xs-components-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' :
                                            'id="xs-components-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' }>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/BaseMetadataEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >BaseMetadataEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DirectRelationsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DirectRelationsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FormCoreEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FormCoreEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FormMetadataEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FormMetadataEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IndirectRelPropertyComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IndirectRelPropertyComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IndirectRelationsComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IndirectRelationsComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexEntryEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexEntryEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexEntryMetadataEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexEntryMetadataEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexicalEntryEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexicalEntryEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoginComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoginComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MainLayoutComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MainLayoutComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RelationEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RelationEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SemanticRelDirectComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SemanticRelDirectComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SemanticRelEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SemanticRelEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SemanticRelIndirectComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SemanticRelIndirectComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SenseCoreEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SenseCoreEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SenseMetadataEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SenseMetadataEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TabsFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TabsFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TabsLexicalEntryComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TabsLexicalEntryComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TabsSenseComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TabsSenseComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TextAnnotationEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TextAnnotationEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceCorpusExplorerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceCorpusExplorerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceLayoutComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceLayoutComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceLexiconEditTileComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceLexiconEditTileComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceLexiconTileComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceLexiconTileComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceListComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceMenuComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceMenuComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceTextSelectorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceTextSelectorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceTextWindowComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceTextWindowComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#directives-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' : 'data-target="#xs-directives-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' :
                                        'id="xs-directives-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' }>
                                        <li class="link">
                                            <a href="directives/MatchNewPasswordDirective.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MatchNewPasswordDirective</a>
                                        </li>
                                    </ul>
                                </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' : 'data-target="#xs-injectables-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' :
                                        'id="xs-injectables-links-module-AppModule-f08a0c37607aae6cb8cf40888c6d49b283525c2fc437f10bd0642e4684082f7f317b4289c8c33e4f9c48aff38c46eae408c6f0c02648890923d23dbd6f12a6d0"' }>
                                        <li class="link">
                                            <a href="injectables/CommonService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >CommonService</a>
                                        </li>
                                    </ul>
                                </li>
                            </li>
                            <li class="link">
                                <a href="modules/AppRoutingModule.html" data-type="entity-link" >AppRoutingModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/IconsModule.html" data-type="entity-link" >IconsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-IconsModule-b72cc03043b5b3bafe29e2fb5378854226ff1ba50a7c1ee0e5eb5c9f2b3ffe52aeb8ed0bc8ebbc7c6268b8207b5c58a45cac2ecf0810186889f395f2fbfc0a20"' : 'data-target="#xs-components-links-module-IconsModule-b72cc03043b5b3bafe29e2fb5378854226ff1ba50a7c1ee0e5eb5c9f2b3ffe52aeb8ed0bc8ebbc7c6268b8207b5c58a45cac2ecf0810186889f395f2fbfc0a20"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-IconsModule-b72cc03043b5b3bafe29e2fb5378854226ff1ba50a7c1ee0e5eb5c9f2b3ffe52aeb8ed0bc8ebbc7c6268b8207b5c58a45cac2ecf0810186889f395f2fbfc0a20"' :
                                            'id="xs-components-links-module-IconsModule-b72cc03043b5b3bafe29e2fb5378854226ff1ba50a7c1ee0e5eb5c9f2b3ffe52aeb8ed0bc8ebbc7c6268b8207b5c58a45cac2ecf0810186889f395f2fbfc0a20"' }>
                                            <li class="link">
                                                <a href="components/IconAddFolderComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IconAddFolderComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IconAuthorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IconAuthorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IconBaseComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IconBaseComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IconLayerGroupComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IconLayerGroupComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IconLockComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IconLockComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IconMoveComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IconMoveComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IconNoteComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IconNoteComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IconRenameComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IconRenameComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/IconUploadFileComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >IconUploadFileComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LanguagesManagementModule.html" data-type="entity-link" >LanguagesManagementModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-LanguagesManagementModule-9a0bf8fcfdb478a3b4500b6bc3eac5f37e2351a29e671263f862a8385a034bee81521794f92566be337dedacc43396382fbe6dff2e3ad83087ab9dfb4aa77212"' : 'data-target="#xs-components-links-module-LanguagesManagementModule-9a0bf8fcfdb478a3b4500b6bc3eac5f37e2351a29e671263f862a8385a034bee81521794f92566be337dedacc43396382fbe6dff2e3ad83087ab9dfb4aa77212"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LanguagesManagementModule-9a0bf8fcfdb478a3b4500b6bc3eac5f37e2351a29e671263f862a8385a034bee81521794f92566be337dedacc43396382fbe6dff2e3ad83087ab9dfb4aa77212"' :
                                            'id="xs-components-links-module-LanguagesManagementModule-9a0bf8fcfdb478a3b4500b6bc3eac5f37e2351a29e671263f862a8385a034bee81521794f92566be337dedacc43396382fbe6dff2e3ad83087ab9dfb4aa77212"' }>
                                            <li class="link">
                                                <a href="components/LanguagesListComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LanguagesListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LanguagesViewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LanguagesViewComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LayersModule.html" data-type="entity-link" >LayersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-LayersModule-9228dfcd5bf6499c55d30547dddcf69c73484a9ab1f58aba4f23a1b2b5df4c608e1994f4b7eb86fe69f68d0d90486da224c11aef78b69e2a344c2668bbd40efc"' : 'data-target="#xs-components-links-module-LayersModule-9228dfcd5bf6499c55d30547dddcf69c73484a9ab1f58aba4f23a1b2b5df4c608e1994f4b7eb86fe69f68d0d90486da224c11aef78b69e2a344c2668bbd40efc"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-LayersModule-9228dfcd5bf6499c55d30547dddcf69c73484a9ab1f58aba4f23a1b2b5df4c608e1994f4b7eb86fe69f68d0d90486da224c11aef78b69e2a344c2668bbd40efc"' :
                                            'id="xs-components-links-module-LayersModule-9228dfcd5bf6499c55d30547dddcf69c73484a9ab1f58aba4f23a1b2b5df4c608e1994f4b7eb86fe69f68d0d90486da224c11aef78b69e2a344c2668bbd40efc"' }>
                                            <li class="link">
                                                <a href="components/LayersListComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LayersListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LayersViewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LayersViewComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/LexiconModule.html" data-type="entity-link" >LexiconModule</a>
                            </li>
                            <li class="link">
                                <a href="modules/NamespacesModule.html" data-type="entity-link" >NamespacesModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-NamespacesModule-f5e02b3f1a5d59b1ec675b11c185d02ec061a79af47b9a212dcfd6e9b0f13d29252ba099712b51ab0df2dd50a040f3a1658dab5775f144b24fc954eb26ad7e0b"' : 'data-target="#xs-components-links-module-NamespacesModule-f5e02b3f1a5d59b1ec675b11c185d02ec061a79af47b9a212dcfd6e9b0f13d29252ba099712b51ab0df2dd50a040f3a1658dab5775f144b24fc954eb26ad7e0b"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-NamespacesModule-f5e02b3f1a5d59b1ec675b11c185d02ec061a79af47b9a212dcfd6e9b0f13d29252ba099712b51ab0df2dd50a040f3a1658dab5775f144b24fc954eb26ad7e0b"' :
                                            'id="xs-components-links-module-NamespacesModule-f5e02b3f1a5d59b1ec675b11c185d02ec061a79af47b9a212dcfd6e9b0f13d29252ba099712b51ab0df2dd50a040f3a1658dab5775f144b24fc954eb26ad7e0b"' }>
                                            <li class="link">
                                                <a href="components/NamespacesListComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NamespacesListComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/PageControllersModule.html" data-type="entity-link" >PageControllersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-PageControllersModule-618c154424ef92420e9ee0ef5224897b31fd21b22c9783b54bdc56c36bbf4d50575f2ea2df30f78ee4b5639b0d46f663a11660ab1d2a42443de38b1bedcbc506"' : 'data-target="#xs-components-links-module-PageControllersModule-618c154424ef92420e9ee0ef5224897b31fd21b22c9783b54bdc56c36bbf4d50575f2ea2df30f78ee4b5639b0d46f663a11660ab1d2a42443de38b1bedcbc506"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-PageControllersModule-618c154424ef92420e9ee0ef5224897b31fd21b22c9783b54bdc56c36bbf4d50575f2ea2df30f78ee4b5639b0d46f663a11660ab1d2a42443de38b1bedcbc506"' :
                                            'id="xs-components-links-module-PageControllersModule-618c154424ef92420e9ee0ef5224897b31fd21b22c9783b54bdc56c36bbf4d50575f2ea2df30f78ee4b5639b0d46f663a11660ab1d2a42443de38b1bedcbc506"' }>
                                            <li class="link">
                                                <a href="components/FooterComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FooterComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/HeaderComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >HeaderComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LoaderComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LoaderComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SideMenuComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SideMenuComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/SharedModule.html" data-type="entity-link" >SharedModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' : 'data-target="#xs-components-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' :
                                            'id="xs-components-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' }>
                                            <li class="link">
                                                <a href="components/AutocompleteCheckboxComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AutocompleteCheckboxComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/DoubleAutocompleteComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >DoubleAutocompleteComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/GenericAutocompleteComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >GenericAutocompleteComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PopupDeleteItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PopupDeleteItemComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#directives-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' : 'data-target="#xs-directives-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' :
                                        'id="xs-directives-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' }>
                                        <li class="link">
                                            <a href="directives/NotDuplicateNameDirective.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >NotDuplicateNameDirective</a>
                                        </li>
                                        <li class="link">
                                            <a href="directives/TagsetValueNotDuplicateNameDirective.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TagsetValueNotDuplicateNameDirective</a>
                                        </li>
                                        <li class="link">
                                            <a href="directives/UriValidator.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UriValidator</a>
                                        </li>
                                        <li class="link">
                                            <a href="directives/WhitespacesValidatorDirective.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WhitespacesValidatorDirective</a>
                                        </li>
                                    </ul>
                                </li>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#pipes-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' : 'data-target="#xs-pipes-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' }>
                                            <span class="icon ion-md-add"></span>
                                            <span>Pipes</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="pipes-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' :
                                            'id="xs-pipes-links-module-SharedModule-910b266ad358da23b5f20e87c2258f720253cc3e8bed112449208aaf1f85f7d9053a26429e7a563d5af1fdc0e7c835297bababaada47668635a2638de7275824"' }>
                                            <li class="link">
                                                <a href="pipes/ShouldBeEditablePipe.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >ShouldBeEditablePipe</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/TagsetsModule.html" data-type="entity-link" >TagsetsModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-TagsetsModule-564cba37946d6064d578078f31312f90404d293a80e2892db9a6779323e2deba20ede5afd4138cab1dccfbb4325886b75e17a8b156d89a8f1bd512b013bf8780"' : 'data-target="#xs-components-links-module-TagsetsModule-564cba37946d6064d578078f31312f90404d293a80e2892db9a6779323e2deba20ede5afd4138cab1dccfbb4325886b75e17a8b156d89a8f1bd512b013bf8780"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-TagsetsModule-564cba37946d6064d578078f31312f90404d293a80e2892db9a6779323e2deba20ede5afd4138cab1dccfbb4325886b75e17a8b156d89a8f1bd512b013bf8780"' :
                                            'id="xs-components-links-module-TagsetsModule-564cba37946d6064d578078f31312f90404d293a80e2892db9a6779323e2deba20ede5afd4138cab1dccfbb4325886b75e17a8b156d89a8f1bd512b013bf8780"' }>
                                            <li class="link">
                                                <a href="components/TagsetCreateEditComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TagsetCreateEditComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TagsetsListComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TagsetsListComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                            <li class="link">
                                <a href="modules/UsersManagementModule.html" data-type="entity-link" >UsersManagementModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-UsersManagementModule-e6f4d64cc71eb142d66fce3858b8d204b79c35c46cefcfefab1c538d799507bfbf48c70696e6dcc24b264056457be6294485d2a56f711b1962fe84babc12fbd0"' : 'data-target="#xs-components-links-module-UsersManagementModule-e6f4d64cc71eb142d66fce3858b8d204b79c35c46cefcfefab1c538d799507bfbf48c70696e6dcc24b264056457be6294485d2a56f711b1962fe84babc12fbd0"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-UsersManagementModule-e6f4d64cc71eb142d66fce3858b8d204b79c35c46cefcfefab1c538d799507bfbf48c70696e6dcc24b264056457be6294485d2a56f711b1962fe84babc12fbd0"' :
                                            'id="xs-components-links-module-UsersManagementModule-e6f4d64cc71eb142d66fce3858b8d204b79c35c46cefcfefab1c538d799507bfbf48c70696e6dcc24b264056457be6294485d2a56f711b1962fe84babc12fbd0"' }>
                                            <li class="link">
                                                <a href="components/UserFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UserListComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserListComponent</a>
                                            </li>
                                        </ul>
                                    </li>
                            </li>
                </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#components-links"' :
                            'data-target="#xs-components-links"' }>
                            <span class="icon ion-md-cog"></span>
                            <span>Components</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="components-links"' : 'id="xs-components-links"' }>
                            <li class="link">
                                <a href="components/AnnotationEditorComponent.html" data-type="entity-link" >AnnotationEditorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BaseRelationsComponent.html" data-type="entity-link" >BaseRelationsComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/BaseSemanticInputComponent.html" data-type="entity-link" >BaseSemanticInputComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/FormEditorComponent.html" data-type="entity-link" >FormEditorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/SenseEditorComponent.html" data-type="entity-link" >SenseEditorComponent</a>
                            </li>
                            <li class="link">
                                <a href="components/WorkspaceLayersVisibilityManagerComponent.html" data-type="entity-link" >WorkspaceLayersVisibilityManagerComponent</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#classes-links"' :
                            'data-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/Annotation.html" data-type="entity-link" >Annotation</a>
                            </li>
                            <li class="link">
                                <a href="classes/AnnotationCore.html" data-type="entity-link" >AnnotationCore</a>
                            </li>
                            <li class="link">
                                <a href="classes/AnnotationFeature.html" data-type="entity-link" >AnnotationFeature</a>
                            </li>
                            <li class="link">
                                <a href="classes/AnnotationMetadata.html" data-type="entity-link" >AnnotationMetadata</a>
                            </li>
                            <li class="link">
                                <a href="classes/CorpusElement.html" data-type="entity-link" >CorpusElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/CorpusTileContent.html" data-type="entity-link" >CorpusTileContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/CreateFeature.html" data-type="entity-link" >CreateFeature</a>
                            </li>
                            <li class="link">
                                <a href="classes/DocumentElement.html" data-type="entity-link" >DocumentElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/DocumentMetadata.html" data-type="entity-link" >DocumentMetadata</a>
                            </li>
                            <li class="link">
                                <a href="classes/DocumentSystem.html" data-type="entity-link" >DocumentSystem</a>
                            </li>
                            <li class="link">
                                <a href="classes/Feature.html" data-type="entity-link" >Feature</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeatureForAnnotation.html" data-type="entity-link" >FeatureForAnnotation</a>
                            </li>
                            <li class="link">
                                <a href="classes/FolderElement.html" data-type="entity-link" >FolderElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/Language.html" data-type="entity-link" >Language</a>
                            </li>
                            <li class="link">
                                <a href="classes/Layer.html" data-type="entity-link" >Layer</a>
                            </li>
                            <li class="link">
                                <a href="classes/LexicalEntryOld.html" data-type="entity-link" >LexicalEntryOld</a>
                            </li>
                            <li class="link">
                                <a href="classes/LexiconEditTileContent.html" data-type="entity-link" >LexiconEditTileContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/LexiconStatistics.html" data-type="entity-link" >LexiconStatistics</a>
                            </li>
                            <li class="link">
                                <a href="classes/LexiconTileContent.html" data-type="entity-link" >LexiconTileContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/LineBuilder.html" data-type="entity-link" >LineBuilder</a>
                            </li>
                            <li class="link">
                                <a href="classes/LinguisticRelationModel.html" data-type="entity-link" >LinguisticRelationModel</a>
                            </li>
                            <li class="link">
                                <a href="classes/Morphology.html" data-type="entity-link" >Morphology</a>
                            </li>
                            <li class="link">
                                <a href="classes/OntolexType.html" data-type="entity-link" >OntolexType</a>
                            </li>
                            <li class="link">
                                <a href="classes/PaginatedResponse.html" data-type="entity-link" >PaginatedResponse</a>
                            </li>
                            <li class="link">
                                <a href="classes/Relation.html" data-type="entity-link" >Relation</a>
                            </li>
                            <li class="link">
                                <a href="classes/Relations.html" data-type="entity-link" >Relations</a>
                            </li>
                            <li class="link">
                                <a href="classes/ResourceElement.html" data-type="entity-link" >ResourceElement</a>
                            </li>
                            <li class="link">
                                <a href="classes/SpanCoordinates.html" data-type="entity-link" >SpanCoordinates</a>
                            </li>
                            <li class="link">
                                <a href="classes/Tagset.html" data-type="entity-link" >Tagset</a>
                            </li>
                            <li class="link">
                                <a href="classes/TagsetValue.html" data-type="entity-link" >TagsetValue</a>
                            </li>
                            <li class="link">
                                <a href="classes/TAnnotation.html" data-type="entity-link" >TAnnotation</a>
                            </li>
                            <li class="link">
                                <a href="classes/TAnnotationFeature.html" data-type="entity-link" >TAnnotationFeature</a>
                            </li>
                            <li class="link">
                                <a href="classes/TextChoice.html" data-type="entity-link" >TextChoice</a>
                            </li>
                            <li class="link">
                                <a href="classes/TextHighlight.html" data-type="entity-link" >TextHighlight</a>
                            </li>
                            <li class="link">
                                <a href="classes/TextLine.html" data-type="entity-link" >TextLine</a>
                            </li>
                            <li class="link">
                                <a href="classes/TextoUser.html" data-type="entity-link" >TextoUser</a>
                            </li>
                            <li class="link">
                                <a href="classes/TextRow.html" data-type="entity-link" >TextRow</a>
                            </li>
                            <li class="link">
                                <a href="classes/TextTileContent.html" data-type="entity-link" >TextTileContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/TFeature.html" data-type="entity-link" >TFeature</a>
                            </li>
                            <li class="link">
                                <a href="classes/Tile.html" data-type="entity-link" >Tile</a>
                            </li>
                            <li class="link">
                                <a href="classes/TLayer.html" data-type="entity-link" >TLayer</a>
                            </li>
                            <li class="link">
                                <a href="classes/TTagset.html" data-type="entity-link" >TTagset</a>
                            </li>
                            <li class="link">
                                <a href="classes/TTagsetItem.html" data-type="entity-link" >TTagsetItem</a>
                            </li>
                            <li class="link">
                                <a href="classes/User.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="classes/Workspace.html" data-type="entity-link" >Workspace</a>
                            </li>
                            <li class="link">
                                <a href="classes/WorkspaceChoice.html" data-type="entity-link" >WorkspaceChoice</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#injectables-links"' :
                                'data-target="#xs-injectables-links"' }>
                                <span class="icon ion-md-arrow-round-down"></span>
                                <span>Injectables</span>
                                <span class="icon ion-ios-arrow-down"></span>
                            </div>
                            <ul class="links collapse " ${ isNormalMode ? 'id="injectables-links"' : 'id="xs-injectables-links"' }>
                                <li class="link">
                                    <a href="injectables/AnnotationService.html" data-type="entity-link" >AnnotationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/AuthenticationService.html" data-type="entity-link" >AuthenticationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CommonService.html" data-type="entity-link" >CommonService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CorpusStateService.html" data-type="entity-link" >CorpusStateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FeatureService.html" data-type="entity-link" >FeatureService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/GlobalStateService.html" data-type="entity-link" >GlobalStateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LanguageService.html" data-type="entity-link" >LanguageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LayerService.html" data-type="entity-link" >LayerService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LayerStateService.html" data-type="entity-link" >LayerStateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LexiconService.html" data-type="entity-link" >LexiconService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LoaderService.html" data-type="entity-link" >LoaderService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LoggedUserService.html" data-type="entity-link" >LoggedUserService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/MessageConfigurationService.html" data-type="entity-link" >MessageConfigurationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/RelationService.html" data-type="entity-link" >RelationService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/StorageService.html" data-type="entity-link" >StorageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TagsetService.html" data-type="entity-link" >TagsetService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/TagsetStateService.html" data-type="entity-link" >TagsetStateService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/UserService.html" data-type="entity-link" >UserService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/WorkspaceService.html" data-type="entity-link" >WorkspaceService</a>
                                </li>
                            </ul>
                        </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interceptors-links"' :
                            'data-target="#xs-interceptors-links"' }>
                            <span class="icon ion-ios-swap"></span>
                            <span>Interceptors</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="interceptors-links"' : 'id="xs-interceptors-links"' }>
                            <li class="link">
                                <a href="interceptors/AuthenticationInterceptor.html" data-type="entity-link" >AuthenticationInterceptor</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#guards-links"' :
                            'data-target="#xs-guards-links"' }>
                            <span class="icon ion-ios-lock"></span>
                            <span>Guards</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="guards-links"' : 'id="xs-guards-links"' }>
                            <li class="link">
                                <a href="guards/PendingChangesGuard.html" data-type="entity-link" >PendingChangesGuard</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#interfaces-links"' :
                            'data-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AutoCompleteCompleteEvent.html" data-type="entity-link" >AutoCompleteCompleteEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComponentCanDeactivate.html" data-type="entity-link" >ComponentCanDeactivate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DropdownField.html" data-type="entity-link" >DropdownField</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FeatForAnn.html" data-type="entity-link" >FeatForAnn</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FormCore.html" data-type="entity-link" >FormCore</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FormItem.html" data-type="entity-link" >FormItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FormListItem.html" data-type="entity-link" >FormListItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FormUpdater.html" data-type="entity-link" >FormUpdater</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GenericRelationUpdater.html" data-type="entity-link" >GenericRelationUpdater</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LexicalElementBase.html" data-type="entity-link" >LexicalElementBase</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LexicalEntityResponseBase.html" data-type="entity-link" >LexicalEntityResponseBase</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LexicalEntriesResponse.html" data-type="entity-link" >LexicalEntriesResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LexicalEntryCore.html" data-type="entity-link" >LexicalEntryCore</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LexicalEntryListItem.html" data-type="entity-link" >LexicalEntryListItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LexicalEntryRequest.html" data-type="entity-link" >LexicalEntryRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LexicalEntryUpdater.html" data-type="entity-link" >LexicalEntryUpdater</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LexicalSenseUpdater.html" data-type="entity-link" >LexicalSenseUpdater</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LexiconUpdaterBase.html" data-type="entity-link" >LexiconUpdaterBase</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LexoLanguage.html" data-type="entity-link" >LexoLanguage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LinguisticRelationUpdater.html" data-type="entity-link" >LinguisticRelationUpdater</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LinkElement.html" data-type="entity-link" >LinkElement</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LinkProperty.html" data-type="entity-link" >LinkProperty</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MorphologyProperty.html" data-type="entity-link" >MorphologyProperty</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Namespace.html" data-type="entity-link" >Namespace</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PageEvent.html" data-type="entity-link" >PageEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PropertyElement.html" data-type="entity-link" >PropertyElement</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SelectButtonField.html" data-type="entity-link" >SelectButtonField</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SenseCore.html" data-type="entity-link" >SenseCore</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SenseListItem.html" data-type="entity-link" >SenseListItem</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ? 'data-target="#miscellaneous-links"'
                            : 'data-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});