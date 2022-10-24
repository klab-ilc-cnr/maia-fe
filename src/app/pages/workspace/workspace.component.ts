import { LayerService } from 'src/app/services/layer.service';
import { WorkspaceLayersVisibilityManagerComponent } from './workspace-layers-visibility-manager/workspace-layers-visibility-manager.component';
import { CorpusTileContent } from './../../models/tile/corpus-tile-content';
import { WorkspaceTextWindowComponent } from './workspace-text-window/workspace-text-window.component';
import { style } from '@angular/animations';
import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, ComponentRef, ElementRef, HostListener, OnInit, Renderer2, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { text } from '@fortawesome/fontawesome-svg-core';
import { faPlaneSlash } from '@fortawesome/free-solid-svg-icons';
import { LoginOptions } from 'angular-oauth2-oidc';
import { MenuItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { TextChoice } from 'src/app/models/tile/text-choice-element.model';
import { Tile } from 'src/app/models/tile/tile.model';
import { TileType } from 'src/app/models/tile/tile-type.model';
import { UserService } from 'src/app/services/user.service';
import { WorkspaceService } from 'src/app/services/workspace.service';
// import { WorkspaceMenuComponent } from '../workspace-menu/workspace-menu.component';
import { WorkspaceTextSelectorComponent } from './workspace-text-selector/workspace-text-selector.component';
import { TextTileContent } from 'src/app/models/tile/text-tile-content.model';
import { ThisReceiver } from '@angular/compiler';
import { Workspace } from 'src/app/models/workspace.model';
import { MessageService } from 'primeng/api';
import { WorkspaceCorpusExplorerComponent } from './workspace-corpus-explorer/workspace-corpus-explorer.component';
import { Layer } from 'src/app/models/layer/layer.model';
import { LoaderService } from 'src/app/services/loader.service';
// import { CorpusTileContent } from '../models/tileContent/corpus-tile-content';

//var currentWorkspaceInstance: any;

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit, AfterViewInit {

  private newId = 'new';
  private newWorkspace = false;
  private workspaceId: string | undefined = undefined;

  private textTilePrefix: string = 'textTile_';

  private workSaved = false;
  //private mainPanel: any;
  //private openPanels: Map<string, any> = new Map(); //PROBABILMENTE SI PUò DEPRECARE, USARE STOREDTILES
  private workspaceContainer = "#panelsContainer";

  //private storedData: any;
  //private storedTiles: Map<string, Tile<any>> = new Map();
  private storageName = "storedTiles";

  public items: MenuItem[] = [];
  public visibleLayers: Layer[] = [];

  @ViewChild('panelsContainer') public container!: ElementRef;
  @ViewChild('workspaceMenuContainer') public wsMenuContainer!: ElementRef;

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    //this.mainPanel.close();
    //this.openPanels.forEach((panel, id) => panel.close());

    if (this.workSaved) {

      //Chiudo tutti i pannelli aperti anche i modal
      jsPanel
        .getPanels(function (this: any) {
          return this.classList.contains('jsPanel');
        })
        .forEach((panel: { close: () => any; }) => panel.close());

      localStorage.removeItem(this.storageName)
    }

    return this.workSaved;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: { target: any; }) {
    //this.mainPanel.maximize();
    console.log('Mappa panels');
    //console.log(this.openPanels);
    console.log(jsPanel.getPanels());

    this.resizeContainerHeight()
  }

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private loaderService: LoaderService,
    private layerService: LayerService,
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private vcr: ViewContainerRef,
    private messageService: MessageService,
    private workspaceService: WorkspaceService,
    private renderer: Renderer2) { }

  ngOnInit(): void {

    this.items = [
      {
        label: 'Testo',
        items: [
          // { label: 'Apri', id: 'OPEN', command: (event) => { this.openTextChoicePanel(event) } },
          // { separator: true },
          { label: 'Esplora Corpus', id: 'CORPUS', command: (event) => { this.openExploreCorpusPanel(event) } }
        ]
      },
      {
        label: 'Lessico',
        items: [
          { label: 'Lessico 1', id: 'LEX' },
          { label: 'Lessico 2' }
        ]
      },
      {
        label: 'Ontologia',
        items: [
          { label: 'Ontologia 1', id: 'ONTOLOGIA1' },
          { label: 'Ontologia 2' },
          { label: 'Ontologia 3' }
        ]
      },
      {
        label: 'Salva modifiche', id: 'SAVE', command: (event) => { this.saveWork(event) }
      }/*,
      {
        label: 'Ripristina', id: 'RESTORE', command: (event) => { this.restoreTiles(event) }
      } */
    ];

    this.activeRoute.paramMap.subscribe({
      next: (params) => {
        this.workspaceId = params.get('id') ?? undefined;

        if (!this.workspaceId) {
          this.router.navigate(['workspaces']);
          return;
        }

        this.loaderService.show();
        this.layerService.retrieveLayers().subscribe({
          next: (layers: Layer[]) => {
            this.visibleLayers = layers;
            this.loaderService.hide();

            if (this.workspaceId === this.newId) {
              this.newWorkspace = true;
              return;
            }

            if (this.workspaceId != null && this.workspaceId != undefined) {
              this.newWorkspace = false;
              this.loaderService.show();
              this.workspaceService.loadWorkspaceStatus(Number(this.workspaceId)).subscribe({
                next: (data) => {
                  console.log(data)
                  data.tiles?.forEach(tile => tile.tileConfig = JSON.parse(tile.tileConfig));
                  this.restoreTiles(data);
                  this.loaderService.hide();
                }
              });
              return;
            }
          }
        })
      }
    });

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
            this.tileMap.set(this.id, tile);
            console.log('Added ', this.getTileMap())
            break;

          case TileType.CORPUS:
            this.tileMap.set(this.id, tile);
            console.log('Added ', this.getTileMap())
            break;

          case TileType.LAYERS_LIST:
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
        let index = this.componentsList.findIndex((item: any) => item.id == panelId);
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

  ngAfterViewInit(): void {
    //currentWorkspaceInstance = this;

    this.resizeContainerHeight()
  }

  openExploreCorpusPanel(event: any) {
    var ecPanelId = 'corpusExplorerTile'

    var panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === ecPanelId
    );

    if (panelExist) {
      panelExist.front()
      return;
    }

    let res = this.generateCorpusExplorerPanelConfiguration(ecPanelId);

    let corpusExplorerTileConfig = res.panelConfig;

    let corpusTileElement = jsPanel.create(corpusExplorerTileConfig);

    corpusTileElement
      .resize({
        height: window.innerHeight / 2
      })
      .reposition();
    //.addToPanelsMap();
    const { content, ...text } = corpusExplorerTileConfig;

    corpusExplorerTileConfig.content = undefined;

    let tileObject: Tile<CorpusTileContent> = {
      id: undefined,
      workspaceId: this.workspaceId,
      content: undefined,
      tileConfig: corpusExplorerTileConfig,
      type: TileType.CORPUS
    };


    corpusTileElement.addToTileMap(tileObject);
    corpusTileElement.addComponentToList(res.id, res.component, res.tileType);
  }

  openTextPanel(textId: number, title: string) {
    let modalTextSelect = jsPanel.getPanels(function (this: any) {
      return this.classList.contains('jsPanel-modal');
    })
      .find((x: { id: string; }) => x.id === 'modalTextSelect')

    if (modalTextSelect) {
      modalTextSelect.close();
    }

    var panelId = this.textTilePrefix + textId

    var panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === panelId
    );

    if (panelExist) {
      panelExist.front()
      return;
    }

    let res = this.generateTextTilePanelConfiguration(panelId, textId, title);

    let textTileConfig = res.panelConfig;

    let textTileElement = jsPanel.create(textTileConfig);

    textTileElement
      .resize({
        height: window.innerHeight / 3 * 2,
        width: window.innerWidth / 3 * 2
      })
      .reposition();
    const { content, ...text } = textTileConfig;

    textTileConfig.content = undefined;

    let txtTileContent: TextTileContent = { contentId: textId };

    let tileObject: Tile<TextTileContent> = {
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

  restoreTiles(workspaceStatus: Workspace) {
    console.log('restore');
    this.loaderService.show();

    let storedData: any = workspaceStatus.layout;
    let storedTiles: Array<Tile<any>> = workspaceStatus.tiles!;
    console.log('restored layout', storedData, storedTiles, workspaceStatus);

    if (storedTiles.length == 0) {
      return;
    }

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
          let mergedConfig = { ...textTileComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfig,
            storagename: this.storageName
          });
          //currPanelElement = jsPanel.create(mergedConfig);

          currPanelElement.addToTileMap(tile);
          currPanelElement.addComponentToList(tile.tileConfig.id, tile, tile.type);
          break;

        case TileType.CORPUS:
          let corupusComponent = this.generateCorpusExplorerPanelConfiguration(tile.tileConfig.id);
          let mergedConfigCorpus = { ...corupusComponent.panelConfig, ...tile.tileConfig };

          //Ripristino il layout della tile
          currPanelElement = jsPanel.layout.restoreId({
            id: tile.tileConfig.id,
            config: mergedConfigCorpus,
            storagename: this.storageName
          });

          //currPanelElement = jsPanel.create(mergedConfigCorpus);

          currPanelElement.addToTileMap(tile);
          currPanelElement.addComponentToList(tile.tileConfig.id, tile, tile.type);
          break;

        default:
          console.error("type " + tile.type + " not implemented");
      }
    }

    /* for (const [tileId, tile] of storedTiles.entries()) {
      let currPanelElement = jsPanel.getPanels().find(
        (x: { id: string; }) => x.id === tile.tileConfig.id
      );

      currPanelElement.addContent(tile, this);
    }; */

    this.loaderService.hide();
  }

  retrieveTextList(): TextChoice[] {
    var textList: Array<TextChoice> = [];

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

  saveWork(event: any) {
    //console.log(this.openPanels);
    //this.workSaved = true;

    // save panel layout
    let storedData = jsPanel.layout.save({
      selector: '.jsPanel-standard',
      storagename: this.storageName
    });

    //this.storedTiles = new Map(jsPanel.extensions.getTextTileMap()); //PER TEST, POI VERRà PRESO DAL DB

    let openTiles = jsPanel.extensions.getTileMap();
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

  //Componente creato in maniera dinamica,
  //con gestione manuale degli input e degli eventi
  workspaceTextSelectorComponentToHtml(textList: Array<any>, workspaceComponent: any) {
    const componentRef = this.vcr.createComponent(WorkspaceTextSelectorComponent);

    componentRef.instance.textChoiceList = textList;

    componentRef.instance.onTextSelectEvent
      .subscribe(event => {
        console.log(event.target.getAttribute('data-type'));

        let textId = event.target.parentElement.id;
        let title = event.target.parentElement.querySelector("[data-type='title']").textContent;
        this.openTextPanel(textId, title)
      });

    const element = componentRef.location.nativeElement;
    return element;
  }

  private generateCorpusExplorerPanelConfiguration(ecPanelId: string) {
    const componentRef = this.vcr.createComponent(WorkspaceCorpusExplorerComponent);

    componentRef.instance.onTextSelectEvent
      .subscribe({
        next: (event: any) => {
          console.log("qui", event);

          let textId = event.node.data?.['element-id'];
          let title = event.node.label;

          this.openTextPanel(textId, title.toLowerCase())
        }
      });

    const element = componentRef.location.nativeElement;

    let config = {
      id: ecPanelId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Esplora Corpus',
      maximizedMargin: 5,
      dragit: { snap: true },
      syncMargins: true,
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        //currentWorkspaceInstance.openPanels.delete(panel.id);
        this.removeFromTileMap(panel.id, TileType.CORPUS);
        this.removeComponentFromList(panel.id);
      },
      onfronted: function (this: any, panel: any, status: any) {
        //componentRef.instance.reload()
        let panelIDs = jsPanel.getPanels(function () {
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

  private generateTextTilePanelConfiguration(panelId: string, textId: number, title: string) {
    const componentRef = this.vcr.createComponent(WorkspaceTextWindowComponent);
    componentRef.instance.textId = textId;
    componentRef.instance.height = window.innerHeight / 3 * 2;
    componentRef.instance.visibleLayers = this.visibleLayers;

    const element = componentRef.location.nativeElement;

    let config = this.generateTextTileConfig(panelId, title, element, componentRef)

    return {
      id: panelId,
      component: componentRef,
      panelConfig: config,
      tileType: TileType.TEXT
    };
  }

  private resizeContainerHeight() {
    let height = window.innerHeight - (this.wsMenuContainer.nativeElement.offsetHeight + 1);
    this.renderer.setStyle(this.container.nativeElement, 'height', `${height}px`);
  }

  private generateTextTileConfig(panelId: string, title: string, textWindowComponent: any, componentRef: any) {
    let config =
    {
      id: panelId,
      container: this.workspaceContainer,
      headerTitle: 'testo - ' + title.toLowerCase(),
      content: textWindowComponent,
      maximizedMargin: 5,
      dragit: { snap: true },
      syncMargins: true,
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
        let panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onminimized: function (this: any, panel: any, status: any) {
        let panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onnormalized: function (this: any, panel: any, status: any) {
        let panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onsmallified: function (this: any, panel: any, status: any) {
        let panelH = Number.parseFloat(panel.style.height.split('px')[0]);
        componentRef.instance.updateComponentSize(panelH);
      },
      onunsmallified: function (this: any, panel: any, status: any) {
        let panelH = Number.parseFloat(panel.style.height.split('px')[0]);
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
}

