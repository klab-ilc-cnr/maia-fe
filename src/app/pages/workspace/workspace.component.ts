import { AfterViewInit, ChangeDetectorRef, Component, ComponentRef, ElementRef, HostListener, OnDestroy, OnInit, Renderer2, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem, TreeNode } from 'primeng/api';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { TextChoice } from 'src/app/models/tile/text-choice-element.model';
import { TileType } from 'src/app/models/tile/tile-type.model';
import { Tile } from 'src/app/models/tile/tile.model';
import { LayerService } from 'src/app/services/layer.service';
import { UserService } from 'src/app/services/user.service';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { CorpusTileContent } from './../../models/tile/corpus-tile-content';
import { WorkspaceTextWindowComponent } from './workspace-text-window/workspace-text-window.component';
// import { WorkspaceMenuComponent } from '../workspace-menu/workspace-menu.component';
import { MessageService } from 'primeng/api';
import { Layer } from 'src/app/models/layer/layer.model';
import { LexicalEntryOld, LexicalEntryTypeOld } from 'src/app/models/lexicon/lexical-entry.model';
import { CorpusElement } from 'src/app/models/texto/corpus-element';
import { LexiconEditTileContent } from 'src/app/models/tile/lexicon-edit-tile-content.model';
import { LexiconTileContent } from 'src/app/models/tile/lexicon-tile-content.model';
import { TextTileContent } from 'src/app/models/tile/text-tile-content.model';
import { Workspace } from 'src/app/models/workspace.model';
import { CommonService } from 'src/app/services/common.service';
import { LoaderService } from 'src/app/services/loader.service';
import { StorageService } from 'src/app/services/storage.service';
import { environment } from 'src/environments/environment';
import { WorkspaceCorpusExplorerComponent } from './workspace-corpus-explorer/workspace-corpus-explorer.component';
import { WorkspaceLexiconEditTileComponent } from './workspace-lexicon-edit-tile/workspace-lexicon-edit-tile.component';
import { WorkspaceLexiconTileComponent } from './workspace-lexicon-tile/workspace-lexicon-tile.component';
import { WorkspaceTextSelectorComponent } from './workspace-text-selector/workspace-text-selector.component';
// import { CorpusTileContent } from '../models/tileContent/corpus-tile-content';

/**Variabile dell'istanza corrente del workspace */
let currentWorkspaceInstance: any; //TODO verificare effettivo utilizzo

/**Componente base del workspace */
@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  /**
   * @private
   * Identificativo per un nuovo workspace
   */
  private newId = 'new';

  /**
   * @private
   * Definisce se è un nuovo workspace
   */
  private newWorkspace = false;
  /**
   * @private
   * Identificativo del workspace
   */
  private workspaceId: string | undefined = undefined;

  /**
   * @private
   * Prefisso del titolo di un tile di testo
   */
  private textTilePrefix = 'textTile_';

  /**
   * @private
   * Prefisso dell'ID di un tile di modifica del lessico
   */
  private lexiconEditTilePrefix = 'lexiconEditTile_';

  /**
   * @private
   * Definisce il lavoro è stato salvato
   */
  private workSaved = false;
  //private mainPanel: any;
  //private openPanels: Map<string, any> = new Map(); //PROBABILMENTE SI PUò DEPRECARE, USARE STOREDTILES
  /**
   * @private
   * Id del contenitore dei pannelli nel template
   */
  private workspaceContainer = "#panelsContainer";

  //private storedData: any;
  //private storedTiles: Map<string, Tile<any>> = new Map();
  /**
   * @private
   * Nome della proprietà del localstorage che memorizza i tile
   */
  private storageName = `${this.storageService.tokenPrefix}_storedTiles`;

  /**Sottoscrizione per tracciare emissioni da Common Service */
  // private subscription!: Subscription;

  /**Lista degli elementi di menu di primeng */
  public items: MenuItem[] = [];
  /**Lista dei layer visibili */
  public visibleLayers: Layer[] = [];

  workspaceName!: string;

  /**Riferimento al contenitore die pannelli */
  @ViewChild('panelsContainer') public container!: ElementRef;
  /**Riferimento al contenitore del menu del workspace */
  @ViewChild('workspaceMenuContainer') public wsMenuContainer!: ElementRef;

  // @HostListener allows us to also guard against browser refresh, close, etc.
  /**
   * Metodo che verifica la presenza di modifiche pendenti, se non ve ne sono è possibile navigare altrove direttamente, altrimenti viene visualizzato un popup di conferma.
   * L'hostlistener permette di intercettare anche refresh, chiusura e altri eventi del browser
   * @returns {Observable<boolean>|boolean} definisce se ci sono modifiche pendenti
   */
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    //this.mainPanel.close();
    //this.openPanels.forEach((panel, id) => panel.close());
    this.saveWork(null);

    // if (this.workSaved) {

    //Chiudo tutti i pannelli aperti anche i modal
    jsPanel
      .getPanels(function (this: any) {
        return this.classList.contains('jsPanel');
      })
      .forEach((panel: { close: () => any; }) => panel.close());

    localStorage.removeItem(this.storageName)
    // }

    // return this.workSaved;
    return true;
  }

  /**
   * Metodo che intercetta il ridimensionamento della finestra e richiama la modifica delle dimensioni del contenitore
   * @param event {{target:any}} evento
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: { target: any; }) {
    //this.mainPanel.maximize();
    console.log('Mappa panels');
    //console.log(this.openPanels);
    console.log(jsPanel.getPanels());

    this.resizeContainerHeight()
  }

  /**
   * Costruttore per WorkspaceComponent
   * @param router {Router} servizi per la navigazione fra le viste
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param loaderService {LoaderService} servizi per la gestione del segnale di caricamento
   * @param layerService {LayerService} servizi relativi ai layer
   * @param userService {UserService} servizi relativi agli utenti //TODO verificare se possiamo rimuovere
   * @param cd {ChangeDetectorRef} fornisce funzionalità di verifica di modifiche per la visualizzazione //TODO verificare se possiamo rimuovere
   * @param vcr {ViewContainerRef} contenitore dove un o più view possono essere attaccate a un componente
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param workspaceService {WorkspaceService} servizi relativi ai workspace
   * @param renderer {Renderer2} classe che può essere estesa per implementare renderizzazioni personalizzate
   * @param commonService {CommonService} servizi comuni
   */
  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private loaderService: LoaderService,
    private layerService: LayerService,
    private userService: UserService,
    private vcr: ViewContainerRef,
    private messageService: MessageService,
    private workspaceService: WorkspaceService,
    private renderer: Renderer2,
    private commonService: CommonService,
    private storageService: StorageService
  ) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per il recupero iniziale dei dati e per sottoscrivere i comportamenti del jsPanel */
  ngOnInit(): void {

    this.commonService.notifyObservable$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((res) => {
      if ('option' in res && res.option === 'onLexiconTreeElementDoubleClickEvent') {
        const selectedSubTree = structuredClone(res.value[0]);
        const showLabelName = structuredClone(res.value[1]);
        this.openLexiconEditTile(selectedSubTree, showLabelName);
      }
    })

    this.items = [
      {
        label: 'Corpus',
        styleClass: 'p-button-raised p-button-text',
        // items: [
        // { label: 'Apri', id: 'OPEN', command: (event) => { this.openTextChoicePanel(event) } },
        // { separator: true },
        // { label: 'Esplora Corpus', id: 'CORPUS', command: (event) => { this.openExploreCorpusPanel(event) } }
        // ]
        command: (event) => { this.openExploreCorpusPanel(event) }
      },
      {
        label: 'Lexicon',
        // items: [
        //   { label: 'Apri', id: 'LEXICON', command: (event) => { this.openLexiconPanel(event) } },
        //   { label: 'Lessico 2' }
        // ]
        command: (event) => { this.openLexiconPanel(event) }
      },
      // {
      //   label: 'Ontology',
      //   // items: [
      //   //   { label: 'Ontologia 1', id: 'ONTOLOGIA1' },
      //   //   { label: 'Ontologia 2' },
      //   //   { label: 'Ontologia 3' }
      //   // ]
      // },
      // {
      //   label: 'Salva modifiche', id: 'SAVE', command: (event) => { this.saveWork(event) }
      // }
      /*,
      {
        label: 'Ripristina', id: 'RESTORE', command: (event) => { this.restoreTiles(event) }
      } */
    ];
    if (!environment.demoHide) {
      this.items.push({ label: 'Ontology' });
    }

    this.activeRoute.paramMap.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((params) => {
      this.workspaceId = params.get('id') ?? undefined;

      if (!this.workspaceId) {
        this.router.navigate(['workspaces']);
        return;
      }

      // this.loaderService.show();
      // this.layerService.retrieveLayers().subscribe({
      //   next: (layers: Layer[]) => {
      //     this.visibleLayers = layers; //TODO da gestire
      //     this.loaderService.hide();

      if (this.workspaceId === this.newId) {
        this.newWorkspace = true;
        return;
      }

      if (this.workspaceId != null && this.workspaceId != undefined) {
        this.newWorkspace = false;
        this.loaderService.show();
        this.workspaceService.loadWorkspaceStatus(Number(this.workspaceId)).pipe(
          take(1),
        ).subscribe((data) => {
          console.info('load workspace status data', data)
          data.tiles?.forEach(tile => tile.tileConfig = JSON.parse(tile.tileConfig));
          this.restoreTiles(data);
          this.loaderService.hide();
        }
        );
        return;
      }
    }
      // })
      // }
    );

    if (this.workspaceId && this.workspaceId !== this.newId) {
      this.workspaceService.getWorkspaceName(+this.workspaceId).pipe(take(1)).subscribe(res => {
        this.workspaceName = res;
      })
    }

    jsPanel.extend({
      //mappa key:idPannello, value: tipo e id del tipo, es. testi, ontologie, lessico.
      textTileMap: new Map<number, Tile<TextTileContent>>(),
      tileMap: new Map<number, Tile<any>>(),
      componentsList: new Array<any>(),
      // addToPanelsMap: function () {
      //   currentWorkspaceInstance.openPanels.set(this.id, this);

      //   return this;
      // },
      addToTileMap: function (tile: Tile<any>) {
        console.log(tile)
        switch (tile.type as TileType) {
          case TileType.TEXT:
          case TileType.CORPUS:
          case TileType.LAYERS_LIST:
          case TileType.LEXICON:
            // case TileType.LEXICON_EDIT: //TODO era una mia aggiunta ma il salvataggio su BE non pare gestito
            this.tileMap.set(this.id, tile);
            console.log('Added ', this.getTileMap())
            break;

          default:
            console.error("type " + tile.type + " not implemented");
        }

        return this;
      },
      removeFromTileMap: function (panelId: number, type: TileType) {
        switch (type) {
          case TileType.TEXT:
            this.tileMap.delete(panelId);
            console.log('Deleted ', this.getTileMap());
            break;

          case TileType.CORPUS:
            this.tileMap.delete(panelId);
            console.log('Deleted ', this.getTileMap());
            break;

          case TileType.LAYERS_LIST:
            this.tileMap.delete(panelId);
            console.log('Deleted ', this.getTileMap());
            break;

          default:
            console.error("type " + type + " not implemented");
        }

        return this;
      },
      addComponentToList: function (panelId: string, componentRef: ComponentRef<any>, tileType: TileType) {
        this.componentsList.push({
          id: panelId,
          component: componentRef,
          tileType: tileType
        });
      },
      removeComponentFromList: function (panelId: string) {
        const index = this.componentsList.findIndex((item: any) => item.id == panelId);
        this.componentsList.splice(index, 1);
      },
      deleteTileContent: function (panelId: number, type: TileType) {
        switch (type) {
          case TileType.TEXT:
            this.textTileMap.delete(panelId);
            console.log('Deleted ', this.getTextTileMap());
            break;
          default:
            console.error("type ${type} not implemented");
        }

        return this;
      },
      getTextTileMap: function () {
        return this.textTileMap;
      },
      getTileMap: function () {
        return this.tileMap;
      },
      getComponentsList: function () {
        return this.componentsList;
      }
    })
  }

  /**Metodo dell'interfaccia AfterViewInit, utilizzato per inizializzare il currentWorkspaceInstance e ridimensioare il contenitore */
  ngAfterViewInit(): void {
    currentWorkspaceInstance = this;

    this.resizeContainerHeight()
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per eliminare eventuali sottoscrizioni */
  ngOnDestroy(): void {
    // this.subscription.unsubscribe();
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
   * Metodo che visualizza il pannello di esplorazione del corpus
   * @param event {any} evento di click su esplora corpus
   * @returns {void}
   */
  openExploreCorpusPanel(event: any) {
    const ecPanelId = 'corpusExplorerTile'

    const panelExist = jsPanel.getPanels().find( //verifica se il panel è già presente
      (x: { id: string; }) => x.id === ecPanelId
    );

    if (panelExist) {
      panelExist.front() //presumibilmente sposta la vista in primo piano
      return; //esce senza eseguire ulteriori azioni, pannello unico non sono possibili pannelli multipli
    }

    const res = this.generateCorpusExplorerPanelConfiguration(ecPanelId);

    const corpusExplorerTileConfig = res.panelConfig;

    const corpusTileElement = jsPanel.create(corpusExplorerTileConfig);
    corpusTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    corpusTileElement.titlebar.style.fontSize = '14px'

    corpusTileElement
      .resize({
        height: window.innerHeight / 2
      })
      .reposition();
    //.addToPanelsMap();
    const { content, ...text } = corpusExplorerTileConfig;

    corpusExplorerTileConfig.content = undefined;

    const tileObject: Tile<CorpusTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: undefined,
      tileConfig: corpusExplorerTileConfig,
      type: TileType.CORPUS
    };


    corpusTileElement.addToTileMap(tileObject);
    corpusTileElement.addComponentToList(res.id, res.component, res.tileType);
  }

  /**
   * Metodo che apre il pannello di annotazione di un testo
   * @param textId {number} identificativo numerico del testo
   * @param title {string} titolo del testo
   * @returns {void}
   */
  openTextPanel(textId: number, title: string) {
    const modalTextSelect = jsPanel.getPanels(function (this: any) {
      return this.classList.contains('jsPanel-modal');
    })
      .find((x: { id: string; }) => x.id === 'modalTextSelect')

    if (modalTextSelect) {
      modalTextSelect.close();
    }

    const panelId = this.textTilePrefix + textId

    const panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === panelId
    );

    if (panelExist) { //caso di pannello già presente
      panelExist.front()
      return;
    }

    const res = this.generateTextTilePanelConfiguration(panelId, textId, title);

    const textTileConfig = res.panelConfig;

    const textTileElement = jsPanel.create(textTileConfig); //crea il pannello di annotazione del testo
    textTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    textTileElement.titlebar.style.fontSize = '14px'


    textTileElement
      .resize({
        height: window.innerHeight / 3 * 2,
        width: window.innerWidth / 3 * 2
      })
      .reposition();
    const { content, ...text } = textTileConfig;

    textTileConfig.content = undefined;

    const txtTileContent: TextTileContent = { contentId: textId };

    const tileObject: Tile<TextTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: txtTileContent,
      tileConfig: textTileConfig,
      type: TileType.TEXT
    };

    textTileElement.addToTileMap(tileObject);
    textTileElement.addComponentToList(res.id, res.component, res.tileType);

    // textTile.options.onclosed.push(function (this: any, panel: any, closedByUser: boolean) {
    //   currentWorkspaceInstance.openPanels.delete(panel.id);
    //   this.deleteTileContent(panel.id, TileType.TEXT);
    // });
  }

  /**
   * Metodo che gestisce l'apertura di un pannello di esplorazione del lessico
   * @param event {any} evento di clic su apri pannello di esplorazione del lessico
   * @returns {void}
   */
  openLexiconPanel(event: any) {
    const lexiconPanelId = 'lexiconTile'

    const panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === lexiconPanelId
    );

    if (panelExist) { //caso pannello di esplorazione del lessico esistente
      panelExist.front()
      return;
    }

    const result = this.generateLexiconPanelConfiguration(lexiconPanelId);

    const lexiconTileConfig = result.panelConfig;

    const lexiconTileElement = jsPanel.create(lexiconTileConfig);
    lexiconTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    lexiconTileElement.titlebar.style.fontSize = '14px'


    lexiconTileElement
      .resize({
        height: window.innerHeight / 2
      })
      .reposition();

    const { content, ...text } = lexiconTileConfig;

    lexiconTileConfig.content = undefined;

    const tileObject: Tile<LexiconTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: undefined,
      tileConfig: lexiconTileConfig,
      type: TileType.LEXICON
    };


    lexiconTileElement.addToTileMap(tileObject);
    lexiconTileElement.addComponentToList(result.id, result.component, result.tileType);
  }

  /**
   * Metodo che apre un pannello di modifica di un'entrata lessicale
   * @param selectedSubTree {TreeNode<LexicalEntryOld>} sottonodo entrata lessicale selezionato
   * @param showLabelName {boolean} definisce se visualizzare la label come nome
   * @returns {void}
   */
  openLexiconEditTile(selectedSubTree: TreeNode<LexicalEntryOld>, showLabelName: boolean) {
    // var lexiconEditTileId = 'lexiconEditTile';
    const lexicalEntryTree = selectedSubTree.data?.type === LexicalEntryTypeOld.LEXICAL_ENTRY ? selectedSubTree : selectedSubTree.parent?.parent;
    const idAfterHash = lexicalEntryTree?.data?.instanceName?.split('#')[1];
    const lexiconEditTileId = this.lexiconEditTilePrefix + idAfterHash;
    const panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === lexiconEditTileId
    );

    if (panelExist) {
      panelExist.front(); //metto il pannello in primo piano
      return;
    }

    const result = this.generateLexiconEditTileConfiguration(lexiconEditTileId, selectedSubTree, showLabelName);

    const lexiconEditTileConfig = result.panelConfig;

    const lexiconEditTileElement = jsPanel.create(lexiconEditTileConfig);
    lexiconEditTileElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
    lexiconEditTileElement.titlebar.style.fontSize = '14px'

    lexiconEditTileElement
      .resize({
        height: window.innerHeight / 1.5
      })
      .reposition();

    const { content, ...text } = lexiconEditTileConfig;

    const tileObject: Tile<LexiconEditTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: undefined,
      tileConfig: lexiconEditTileConfig,
      type: TileType.LEXICON_EDIT
    };

    lexiconEditTileElement.addToTileMap(tileObject);
    lexiconEditTileElement.addComponentToList(result.id, result.component, result.tileType);
  }

  /**
   * Metodo che dato lo status del workspace lo riapre con le medesime caratteristiche
   * @param workspaceStatus {Workspace} status del workspace
   * @returns {void}
   */
  restoreTiles(workspaceStatus: Workspace) {
    console.log('restore');
    this.loaderService.show();

    let storedData: any = workspaceStatus.layout;
    const storedTiles: Array<Tile<any>> = workspaceStatus.tiles!;
    console.log('restored layout', storedData, storedTiles, workspaceStatus);

    if (storedTiles.length == 0) {
      return;
    }

    const iterableStoredData = JSON.parse(storedData); //TODO verificare il workaround utilizzato per il ricalcolo delle dimensioni dei panel in caso di cambio schermo (da grande a piccolo)
    let tempStoredData = [];
    for (const tile of iterableStoredData) {
      const tempTile = { ...tile };
      const width = +tile.width.toString().replace('px', '');
      const height = +tile.height.toString().replace('px', '');
      if (width > window.innerWidth) {
        tempTile.width = window.innerWidth + 'px'
        tempTile.left = '0px'
      }
      if (height > window.innerHeight) {
        tempTile.height = (window.innerHeight * 0.8) + 'px'
        tempTile.left = '0px'
      }
      tempStoredData.push(tempTile)
    }
    storedData = JSON.stringify(tempStoredData)

    //IMPORTANTE Ripristino i dati nel localstorage PRIMA di fare restore,
    //il localstorage verrà letto dalla funzione jsPanel.layout.restore()
    localStorage.setItem(this.storageName, storedData)

    let currPanelElement;
    //Creazione dinamica oggetto, secondo la struttura richiesta da jsPanel
    for (const [index, tile] of storedTiles.entries()) {
      switch (tile.type as TileType) {
        case TileType.TEXT:
          var textTileComponent = this.generateTextTilePanelConfiguration(tile.tileConfig.id, tile.content?.contentId!, tile.tileConfig.headerTitle);

          //IMPORTANTE il merge delle config così da aggiunge le callback di risposta agli eventi,
          //che non vengono incluse dalla funzione layout.save di jspanel e salvate nel db
          const mergedConfig = { ...textTileComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfig,
            storagename: this.storageName
          });
          //currPanelElement = jsPanel.create(mergedConfig);

          break;

        case TileType.CORPUS:
          const corupusComponent = this.generateCorpusExplorerPanelConfiguration(tile.tileConfig.id);
          const mergedConfigCorpus = { ...corupusComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfigCorpus,
            storagename: this.storageName
          });

          //currPanelElement = jsPanel.create(mergedConfigCorpus);

          break;

        case TileType.LEXICON:
          const lexiconComponent = this.generateLexiconPanelConfiguration(tile.tileConfig.id);
          const mergedConfigLexicon = { ...lexiconComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfigLexicon,
            storagename: this.storageName
          });

          //ATTENZIONE gli handler del componente jspanel headerControls non vengono ripristinati dalla funzione di restore,
          // è necessario reinserirlo manualmente
          currPanelElement.options.headerControls.add.handler = function (panel: any, control: any) {
            currentWorkspaceInstance.commonService.notifyOther({ option: 'tag_clicked', value: 'clicked' });
          }
          /*           currPanelElement.setControlStatus('tag', undefined, function (panel: any, control: any) {
                      currentWorkspaceInstance.commonService.notifyOther({ option: 'tag_clicked', value: 'clicked' });
                    }); */

          break;

        default:
          console.error("type " + tile.type + " not implemented");
      }
      currPanelElement.titlebar.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
      currPanelElement.titlebar.style.fontSize = '14px'
      currPanelElement.addToTileMap(tile);
      currPanelElement.addComponentToList(tile.tileConfig.id, tile, tile.type);

    }

    /* for (const [tileId, tile] of storedTiles.entries()) {
      let currPanelElement = jsPanel.getPanels().find(
        (x: { id: string; }) => x.id === tile.tileConfig.id
      );

      currPanelElement.addContent(tile, this);
    }; */

    this.loaderService.hide();
  }

  /**
   * Metodo che recupera la lista dei testi come elementi per la scelta
   * @returns {TextChoice[]} lista dei testi come elementi selezionabili
   */
  retrieveTextList(): TextChoice[] {
    const textList: Array<TextChoice> = [];

    this.loaderService.show();
    this.workspaceService.retrieveTextChoiceList().subscribe({
      next: (data) => {
        //data.forEach(el => textList.push({title:el.title, status:el.status, createdBy: el.createdBy, updatedOn:el.updatedOn}))
        //textList=data;
        //textList = JSON.parse(JSON.stringify(data));
        data.forEach(el => textList.push(el));
        this.loaderService.hide();
      }
    });

    return textList;
  }

  /**
   * Metodo che esegue il salvataggio dello stato del workspace
   * @param event {any} evento di click sul salvataggio
   */
  saveWork(event: any) {
    //console.log(this.openPanels);
    //this.workSaved = true;

    // save panel layout
    const storedData = jsPanel.layout.save({
      selector: '.jsPanel-standard',
      storagename: this.storageName
    });

    //this.storedTiles = new Map(jsPanel.extensions.getTextTileMap()); //PER TEST, POI VERRà PRESO DAL DB

    const openTiles = jsPanel.extensions.getTileMap();
    this.loaderService.show();
    this.workspaceService
      .saveWorkspaceStatus(Number(this.workspaceId!), storedData, openTiles)
      .subscribe({
        next: () => {
          this.workSaved = true;
          this.loaderService.hide();
          this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Workspace salvato', life: 3000 });
        }
      });

    // close panels, here we simply close all panels in the document
    // for (const panel of jsPanel.getPanels()) {
    //   panel.close();
    // }

    // for demo purpose only log stored data to the console
    // or use your browser's dev tools to inspect localStorage
    console.log('stored data', storedData);
  }

  //TODO verificare perché non sembra sia utilizzato
  /**
   * Componente creato in maniera dinamica, con gestione manuale degli input e degli eventi
   * @param textList {Array<any>} lista dei testi
   * @param workspaceComponent {any} ?
   * @returns {any} elemento html del selettore di testo
   */
  workspaceTextSelectorComponentToHtml(textList: Array<any>, workspaceComponent: any) {
    const componentRef = this.vcr.createComponent(WorkspaceTextSelectorComponent);

    componentRef.instance.textChoiceList = textList;

    componentRef.instance.onTextSelectEvent
      .subscribe(event => {
        console.log(event.target.getAttribute('data-type'));

        const textId = event.target.parentElement.id;
        const title = event.target.parentElement.querySelector("[data-type='title']").textContent;
        this.openTextPanel(textId, title)
      });

    const element = componentRef.location.nativeElement;
    return element;
  }

  /**
   * @private
   * Metodo che genera la configurazione per il panel explorer corpus incluso il componente
   * @param ecPanelId {string} identificativo del pannello explorer corpus
   * @returns configurazione del pannello
   */
  private generateCorpusExplorerPanelConfiguration(ecPanelId: string) {
    const componentRef = this.vcr.createComponent(WorkspaceCorpusExplorerComponent);

    const subs = componentRef.instance.onTextSelectEvent //mappa l'evento di selezione di un testo nell'ec
      .subscribe((resource: CorpusElement) => {
        console.info('onTextSelectEvent ricevuto', resource);
        const textId = resource.id;
        const title = resource.name ?? '';
        this.openTextPanel(textId, title?.toLowerCase());
      }
      );

    const element = componentRef.location.nativeElement;

    const config = {
      id: ecPanelId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Corpus Explorer',
      maximizedMargin: 5,
      dragit: { snap: true },
      syncMargins: true,
      theme: {
        bgPanel: '#a8c0ce',
        bgContent: '#fff',
        colorHeader: 'black',
        colorContent: `#${jsPanel.colorNames.gray700}`,
        border: 'thin solid #a8c0ce',
        borderRadius: '.33rem',
      },
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        //currentWorkspaceInstance.openPanels.delete(panel.id);
        this.removeFromTileMap(panel.id, TileType.CORPUS);
        this.removeComponentFromList(panel.id);
        subs.unsubscribe();
      },
      onfronted: function (this: any, panel: any, status: any) {
        //componentRef.instance.reload()
        const panelIDs = jsPanel.getPanels(function () {
          return panel.classList.contains('jsPanel-standard');
        }).map((panel: any) => panel.id);
        console.log(panelIDs)
      }
    };

    return {
      id: ecPanelId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.CORPUS
    };
  }

  /**
   * @private
   * Metodo che genera la configurazione del pannello di annotazione di un testo, incluso il componente relativo
   * @param panelId {string} identificativo del pannello
   * @param textId {number} identificativo numerico del testo
   * @param title {string} titolo del testo
   * @returns configurazione del pannello di annotazione di un testo
   */
  private generateTextTilePanelConfiguration(panelId: string, textId: number, title: string) {
    const componentRef = this.vcr.createComponent(WorkspaceTextWindowComponent);
    componentRef.instance.textId = textId;
    componentRef.instance.height = window.innerHeight / 3 * 2;
    // componentRef.instance.visibleLayers = this.visibleLayers;

    const element = componentRef.location.nativeElement;

    const config = this.generateTextTileConfig(panelId, title, element, componentRef)

    return {
      id: panelId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.TEXT
    };
  }

  /**
   * @private
   * Metodo che ridimensiona l'altezza del contenitore del workspace
   */
  private resizeContainerHeight() {
    const height = window.innerHeight - (this.wsMenuContainer.nativeElement.offsetHeight + 1);
    this.renderer.setStyle(this.container.nativeElement, 'height', `${height}px`);
  }

  /**
   * @private
   * Metodo che genera la configurazione del tile di testo
   * @param panelId {string} identificativo del pannello
   * @param title {string} titolo del testo
   * @param textWindowComponent {any} accesso diretto al native element
   * @param componentRef {any} componentRef di WorkspaceTextWindowComponent
   * @returns configurazione del tile di testo
   */
  private generateTextTileConfig(panelId: string, title: string, textWindowComponent: any, componentRef: any) {
    const config =
    {
      id: panelId,
      container: this.workspaceContainer,
      headerTitle: 'text - ' + title.toLowerCase(),
      content: textWindowComponent,
      maximizedMargin: 5,
      dragit: { snap: true },
      syncMargins: true,
      theme: {
        bgPanel: '#a8c0ce',
        colorHeader: 'black',
        border: 'thin solid #a8c0ce',
        borderRadius: '.33rem',
      },
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        //currentWorkspaceInstance.openPanels.delete(panel.id);
        //this.deleteTileContent(panel.id, TileType.TEXT);
        console.log(this, panel, closedByUser)
        this.removeFromTileMap(panel.id, TileType.TEXT);
        this.removeComponentFromList(panel.id);
      },
      onfronted: function (this: any, panel: any, status: any) {
        //componentRef.instance.reload()
        console.log('panel', this, panel, status)
      },
      onmaximized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onminimized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onnormalized: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onsmallified: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onunsmallified: function (this: any, panel: any, status: any) {
        const panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      resizeit: {
        resize: (panel: any, paneldata: any, event: any) => {
          console.log('hi')
          componentRef.instance.updateHeight(paneldata.height)
          console.log(panel, paneldata, event)
        },
        stop: (panel: any, paneldata: any, event: any) => {
          componentRef.instance.updateTextEditorSize();
        }
      }
    };
    return config;
  }

  /**
   * @private
   * Metodo che genera la configurazione del pannello di esplorazione del lessico
   * @param lexiconPanelId {string} identificativo del pannello di esplorazione del lessico
   * @returns configurazione del pannello di esplorazione del lessico
   */
  private generateLexiconPanelConfiguration(lexiconPanelId: string) {
    const componentRef = this.vcr.createComponent(WorkspaceLexiconTileComponent);

    const element = componentRef.location.nativeElement;

    const config = {
      id: lexiconPanelId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Lexicon Explorer',
      maximizedMargin: 5,
      dragit: { snap: true },
      contentOverflow: 'hidden',
      syncMargins: true,
      theme: {
        bgPanel: '#a8c0ce',
        colorHeader: 'black',
        border: 'thin solid #a8c0ce',
        borderRadius: '.33rem',
      },
      panelSize: {
        width: () => window.innerWidth * 0.2,
        height: '60vh'
      },
      headerControls: {
        add: {
          html: '<span class="pi pi-tag"></span>',
          name: 'tag',
          handler: (panel: any, control: any) => {
            this.commonService.notifyOther({ option: 'tag_clicked', value: 'clicked' });
          }
        }
      },
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        this.removeFromTileMap(panel.id, TileType.CORPUS);
        this.removeComponentFromList(panel.id);
      },
      onfronted: function (this: any, panel: any, status: any) {
        const panelIDs = jsPanel.getPanels(function () {
          return panel.classList.contains('jsPanel-standard');
        }).map((panel: any) => panel.id);
        console.log(panelIDs)
      }
    };

    return {
      id: lexiconPanelId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.CORPUS
    };
  }

  /**
   * @private
   * Metodo che genera la configurazione del pannello di edit del lessico
   * @param lexiconEditTileId {string} identificativo del tile di edit del lessico
   * @param selectedSubTree {TreeNode<LexicalEntryOld>} sottonodo entrata lessicale selezionato
   * @param showLabelName {boolean} definisce se visualizzare la label come nome
   */
  private generateLexiconEditTileConfiguration(lexiconEditTileId: string, selectedSubTree: TreeNode<LexicalEntryOld>, showLabelName: boolean) {
    const componentRef = this.vcr.createComponent(WorkspaceLexiconEditTileComponent);

    componentRef.instance.selectedType = selectedSubTree.data!.type!;
    componentRef.instance.selectedNode = selectedSubTree;
    componentRef.instance.panelId = lexiconEditTileId;

    const lexicalEntryTree = selectedSubTree.data?.type === LexicalEntryTypeOld.LEXICAL_ENTRY ? selectedSubTree : selectedSubTree.parent?.parent;

    switch (selectedSubTree.data!.type) {
      case LexicalEntryTypeOld.LEXICAL_ENTRY:
        selectedSubTree.expanded = false;
        componentRef.instance.lexicalEntryTree = [selectedSubTree];
        break;
      case LexicalEntryTypeOld.FORM:
      case LexicalEntryTypeOld.SENSE:
        componentRef.instance.lexicalEntryTree = [selectedSubTree.parent!.parent!];
        break;
    }
    componentRef.instance.showLabelName = showLabelName; //tirato fuori dallo switch perché si ripeteva

    const element = componentRef.location.nativeElement;

    const config = {
      id: lexiconEditTileId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Lexicon editor - ' + lexicalEntryTree?.data?.label,
      maximizedMargin: 5,
      dragit: { snap: true },
      syncMargins: true,
      theme: {
        bgPanel: '#a8c0ce',
        colorHeader: 'black',
        border: 'thin solid #a8c0ce',
        borderRadius: '.33rem',
      },
      panelSize: {
        width: () => window.innerWidth * 0.5,
        height: '60vh'
      },
      headerControls: {
        add: {
          html: '<span class="pi pi-tag"></span>',
          name: 'tag',
          handler: () => {
            this.commonService.notifyOther({ option: 'tag_clicked_edit_tile', value: 'clicked' });
          }
        }
      },
      onclosed: function (this: any, panel: any) {
        this.removeFromTileMap(panel.id, TileType.LEXICON_EDIT);
        this.removeComponentFromList(panel.id);
      },
      onfronted: function (this: any, panel: any) {
        const panelIDs = jsPanel.getPanels(function () {
          return panel.classList.contains('jsPanel-standard');
        }).map((panel: any) => panel.id);
      }
    };

    return {
      id: lexiconEditTileId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.LEXICON_EDIT
    };

  }
}

