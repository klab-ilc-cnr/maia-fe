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
                    <a href="index.html" data-type="index-link">projectx-fe documentation</a>
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
                                            'data-target="#components-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' : 'data-target="#xs-components-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' :
                                            'id="xs-components-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' }>
                                            <li class="link">
                                                <a href="components/AnnotationEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AnnotationEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/AppComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AppComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/FormEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >FormEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LayersListComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LayersListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LayersViewComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LayersViewComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/LexicalEntryEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >LexicalEntryEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/MainLayoutComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >MainLayoutComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/PopupDeleteItemComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >PopupDeleteItemComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/RelationEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >RelationEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/SenseEditorComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >SenseEditorComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TagsetCreateEditComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TagsetCreateEditComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/TagsetsListComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >TagsetsListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UserFormComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserFormComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/UserListComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >UserListComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceCorpusExplorerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceCorpusExplorerComponent</a>
                                            </li>
                                            <li class="link">
                                                <a href="components/WorkspaceLayersVisibilityManagerComponent.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >WorkspaceLayersVisibilityManagerComponent</a>
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
                                        'data-target="#directives-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' : 'data-target="#xs-directives-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' }>
                                        <span class="icon ion-md-code-working"></span>
                                        <span>Directives</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="directives-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' :
                                        'id="xs-directives-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' }>
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
                                        'data-target="#injectables-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' : 'data-target="#xs-injectables-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' :
                                        'id="xs-injectables-links-module-AppModule-8adb39d8debecb1a558187b86f8130a426090fdc4e06b81b05f31a3e4d46e9f9282a1b73ffe81f9435dfdac6caede9f4a491347feae662b644c29d77982df87e"' }>
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
                                <a href="modules/AuthConfigModule.html" data-type="entity-link" >AuthConfigModule</a>
                                <li class="chapter inner">
                                    <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                        'data-target="#injectables-links-module-AuthConfigModule-8d82386eb438fb799b490adcd9a5918e6193a231a626e909b211233f77512a9d59394badb0efa22363a121410c4e0ac9cd136e5e952bec92b299a8697791d0d5"' : 'data-target="#xs-injectables-links-module-AuthConfigModule-8d82386eb438fb799b490adcd9a5918e6193a231a626e909b211233f77512a9d59394badb0efa22363a121410c4e0ac9cd136e5e952bec92b299a8697791d0d5"' }>
                                        <span class="icon ion-md-arrow-round-down"></span>
                                        <span>Injectables</span>
                                        <span class="icon ion-ios-arrow-down"></span>
                                    </div>
                                    <ul class="links collapse" ${ isNormalMode ? 'id="injectables-links-module-AuthConfigModule-8d82386eb438fb799b490adcd9a5918e6193a231a626e909b211233f77512a9d59394badb0efa22363a121410c4e0ac9cd136e5e952bec92b299a8697791d0d5"' :
                                        'id="xs-injectables-links-module-AuthConfigModule-8d82386eb438fb799b490adcd9a5918e6193a231a626e909b211233f77512a9d59394badb0efa22363a121410c4e0ac9cd136e5e952bec92b299a8697791d0d5"' }>
                                        <li class="link">
                                            <a href="injectables/AuthConfigService.html" data-type="entity-link" data-context="sub-entity" data-context-id="modules" >AuthConfigService</a>
                                        </li>
                                    </ul>
                                </li>
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
                                <a href="modules/PageControllersModule.html" data-type="entity-link" >PageControllersModule</a>
                                    <li class="chapter inner">
                                        <div class="simple menu-toggler" data-toggle="collapse" ${ isNormalMode ?
                                            'data-target="#components-links-module-PageControllersModule-e0c6e8616bc79956b95137bf22e352181e85f1d33091675e7d4e00a2c4d1208ea6c88369fc0f6e38884e5afaaf8f0c5ba5049adc190e62491b92133d72b6e51f"' : 'data-target="#xs-components-links-module-PageControllersModule-e0c6e8616bc79956b95137bf22e352181e85f1d33091675e7d4e00a2c4d1208ea6c88369fc0f6e38884e5afaaf8f0c5ba5049adc190e62491b92133d72b6e51f"' }>
                                            <span class="icon ion-md-cog"></span>
                                            <span>Components</span>
                                            <span class="icon ion-ios-arrow-down"></span>
                                        </div>
                                        <ul class="links collapse" ${ isNormalMode ? 'id="components-links-module-PageControllersModule-e0c6e8616bc79956b95137bf22e352181e85f1d33091675e7d4e00a2c4d1208ea6c88369fc0f6e38884e5afaaf8f0c5ba5049adc190e62491b92133d72b6e51f"' :
                                            'id="xs-components-links-module-PageControllersModule-e0c6e8616bc79956b95137bf22e352181e85f1d33091675e7d4e00a2c4d1208ea6c88369fc0f6e38884e5afaaf8f0c5ba5049adc190e62491b92133d72b6e51f"' }>
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
                                <a href="classes/AnnotationFeature.html" data-type="entity-link" >AnnotationFeature</a>
                            </li>
                            <li class="link">
                                <a href="classes/AnnotationMetadata.html" data-type="entity-link" >AnnotationMetadata</a>
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
                                <a href="classes/Language.html" data-type="entity-link" >Language</a>
                            </li>
                            <li class="link">
                                <a href="classes/Layer.html" data-type="entity-link" >Layer</a>
                            </li>
                            <li class="link">
                                <a href="classes/LexicalEntry.html" data-type="entity-link" >LexicalEntry</a>
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
                                <a href="classes/Morphology.html" data-type="entity-link" >Morphology</a>
                            </li>
                            <li class="link">
                                <a href="classes/OAuthResourceServerConfig.html" data-type="entity-link" >OAuthResourceServerConfig</a>
                            </li>
                            <li class="link">
                                <a href="classes/OntolexType.html" data-type="entity-link" >OntolexType</a>
                            </li>
                            <li class="link">
                                <a href="classes/Relation.html" data-type="entity-link" >Relation</a>
                            </li>
                            <li class="link">
                                <a href="classes/Relations.html" data-type="entity-link" >Relations</a>
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
                                <a href="classes/TextChoice.html" data-type="entity-link" >TextChoice</a>
                            </li>
                            <li class="link">
                                <a href="classes/TextHighlight.html" data-type="entity-link" >TextHighlight</a>
                            </li>
                            <li class="link">
                                <a href="classes/TextLine.html" data-type="entity-link" >TextLine</a>
                            </li>
                            <li class="link">
                                <a href="classes/TextRow.html" data-type="entity-link" >TextRow</a>
                            </li>
                            <li class="link">
                                <a href="classes/TextTileContent.html" data-type="entity-link" >TextTileContent</a>
                            </li>
                            <li class="link">
                                <a href="classes/Tile.html" data-type="entity-link" >Tile</a>
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
                                    <a href="injectables/AuthConfigService.html" data-type="entity-link" >AuthConfigService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/CommonService.html" data-type="entity-link" >CommonService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/FeatureService.html" data-type="entity-link" >FeatureService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LanguageService.html" data-type="entity-link" >LanguageService</a>
                                </li>
                                <li class="link">
                                    <a href="injectables/LayerService.html" data-type="entity-link" >LayerService</a>
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
                                    <a href="injectables/TagsetService.html" data-type="entity-link" >TagsetService</a>
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
                                <a href="interfaces/ComponentCanDeactivate.html" data-type="entity-link" >ComponentCanDeactivate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DropdownField.html" data-type="entity-link" >DropdownField</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FormUpdater.html" data-type="entity-link" >FormUpdater</a>
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
                                <a href="interfaces/LinguisticRelationUpdater.html" data-type="entity-link" >LinguisticRelationUpdater</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SelectButtonField.html" data-type="entity-link" >SelectButtonField</a>
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