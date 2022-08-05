import { WorkspaceTextWindowComponent } from './workspace-text-window/workspace-text-window.component';
import { style } from '@angular/animations';
import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, ElementRef, HostListener, OnInit, Renderer2, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { text } from '@fortawesome/fontawesome-svg-core';
import { faPlaneSlash } from '@fortawesome/free-solid-svg-icons';
import { LoginOptions } from 'angular-oauth2-oidc';
import { MenuItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { TextChoice } from 'src/app/model/tile/text-choice-element.model';
import { Tile } from 'src/app/model/tile/tile.model';
import { TileType } from 'src/app/model/tile/tile-type.model';
import { UserService } from 'src/app/services/user.service';
import { WorkspaceService } from 'src/app/services/workspace.service';
// import { WorkspaceMenuComponent } from '../workspace-menu/workspace-menu.component';
import { WorkspaceTextSelectorComponent } from './workspace-text-selector/workspace-text-selector.component';
import { TextTileContent } from 'src/app/model/tile/text-tile-content.model';
import { ThisReceiver } from '@angular/compiler';
import { Workspace } from 'src/app/model/workspace.model';
import { MessageService } from 'primeng/api';
import { WorkspaceCorpusExplorerComponent } from './workspace-corpus-explorer/workspace-corpus-explorer.component';
// import { CorpusTileContent } from '../model/tileContent/corpus-tile-content';

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

  public items: MenuItem[] = [];

  //private storedData: any;
  //private storedTiles: Map<string, Tile<any>> = new Map();
  private storageName = "storedTiles";

  @ViewChild('panelsContainer') public container!: ElementRef;
  @ViewChild('workspaceMenuContainer') public wsMenuContainer!: ElementRef;

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private vcr: ViewContainerRef,
    private messageService: MessageService,
    private workspaceService: WorkspaceService,
    private renderer: Renderer2) { }

  ngOnInit(): void {

    this.activeRoute.paramMap.subscribe(params => {

      this.workspaceId = params.get('id') ?? undefined;

      if (this.workspaceId === this.newId) {
        this.newWorkspace = true;
        return;
      }

      if (this.workspaceId != null && this.workspaceId != undefined) {
        this.newWorkspace = false;
        this.workspaceService.loadWorkspaceStatus(Number(this.workspaceId)).subscribe(data => {
          data.tiles?.forEach(tile => tile.tileConfig = JSON.parse(tile.tileConfig));
          this.restoreTiles(data);
        });
        return;
      }

    });

    jsPanel.extend({
      //mappa key:idPannello, value: tipo e id del tipo, es. testi, ontologie, lessico.
      textTileMap: new Map<number, Tile<TextTileContent>>(),

      /*       addToPanelsMap: function () {
              currentWorkspaceInstance.openPanels.set(this.id, this);

              return this;
            }, */
      addToTileMap: function (panelId: number, tile: Tile<any>) {
        switch (tile.type as TileType) {
          case TileType.TEXT:
            this.textTileMap.set(panelId, tile);
            console.log('Added ', this.getTextTileMap())
            break;
          default:
            console.error("type " + tile.type + " not implemented");
        }

        return this;
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
      addContent: function (tile: Tile<TextTileContent>, workspaceComponent: WorkspaceComponent) {
        //this rappresenta l'elemento jsPanel
        switch (tile.type as TileType) {
          case TileType.TEXT:
            let el = document.createElement('p');
            workspaceComponent.workspaceService.retrieveText(tile.content?.id!).subscribe(data => {
              el.textContent = data.text ?? '';
              this.content.append(el);

              this.addToTileMap(this.id, tile);
            })
            break;
          default:
            console.error("type " + tile.type + " not implemented");
        }
      }
    })

    this.items = [
      {
        label: 'Testo',
        items: [
          { label: 'Apri', id: 'OPEN', command: (event) => { this.openTextChoicePanel(event) } },
          { separator: true },
          { label: 'Esplora Corpus', id: 'CORPUS', command: (event) => { this.openExploreCorpusPanel(event) } },
          { separator: true },
          { label: 'Testo menu 1' },
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
      }
      /*       ,
            {
              label: 'Ripristina', id: 'RESTORE', command: (event) => { this.restoreTiles(event) }
            } */
    ];
  }

  ngAfterViewInit(): void {
    //currentWorkspaceInstance = this;

    let height = window.innerHeight - (this.wsMenuContainer.nativeElement.offsetHeight + 1);
    this.renderer.setStyle(this.container.nativeElement, 'height', `${height}px`);
  }

  restoreTiles(workspaceStatus: Workspace) {
    console.log('restore');

    let storedData: any = workspaceStatus.layout;
    let storedTiles: Array<Tile<any>> = workspaceStatus.tiles!;
    console.log('restored layout', storedData, storedTiles);

    const tilesConfigs: any = {};

    //Creazione dinamica oggetto, secondo la struttura richiesta da jsPanel
    for (const [index, tile] of storedTiles.entries()) {
      tilesConfigs[this.textTilePrefix + index] = tile.tileConfig;
    }

    console.log('tiles configs', tilesConfigs);

    //Ripristino i dati nel localstorage, che verrà letto successivamente da jsPanel
    localStorage.setItem(this.storageName, storedData)

    //Ripristino le tile
    jsPanel.layout.restore({
      configs: tilesConfigs,
      storagename: this.storageName
    });

    //Ripristino il contenuto delle tile
    for (const [tileId, tile] of storedTiles.entries()) {
      let currPanelElement = jsPanel.getPanels().find(
        (x: { id: string; }) => x.id === tile.tileConfig.id
      );

      currPanelElement.addContent(tile, this);
    };
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

    let openTiles = jsPanel.extensions.getTextTileMap();
    this.workspaceService.saveWorkspaceStatus(Number(this.workspaceId!), storedData, openTiles)
      .subscribe(() => {
        this.workSaved = true;
        this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Workspace salvato', life: 3000 });
      }
      );

    // close panels, here we simply close all panels in the document
    /*     for (const panel of jsPanel.getPanels()) {
          panel.close();
        } */

    // for demo purpose only log stored data to the console
    // or use your browser's dev tools to inspect localStorage
    console.log('stored data', storedData);
  }

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
      jsPanel.getPanels(function (this: any) {
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
    // const documentList = this.retrieveTextList();

    const componentRef = this.vcr.createComponent(WorkspaceCorpusExplorerComponent);

    componentRef.instance.onTextSelectEvent
      .subscribe(event => {
        console.log("qui", event);

        let textId = event.node.data?.['element-id'];
        let title = event.node.label;

        let textTileConfig = {
          id: this.textTilePrefix + textId,
          container: this.workspaceContainer,
          headerTitle: 'testo - ' + title.toLowerCase(),
          maximizedMargin: 5,
          dragit: { snap: true },
          syncMargins: true,
          onclosed: function (this: any, panel: any, closedByUser: boolean) {
            //currentWorkspaceInstance.openPanels.delete(panel.id);
            this.deleteTileContent(panel.id, TileType.TEXT);
          }
        };

        let textTileElement = jsPanel.create(textTileConfig);
        //.addToPanelsMap();

        /*     textTile.options.onclosed.push(function (this: any, panel: any, closedByUser: boolean) {
              currentWorkspaceInstance.openPanels.delete(panel.id);
              this.deleteTileContent(panel.id, TileType.TEXT);
            }); */

        let tileObject: Tile<TextTileContent> =
        {
          id: undefined,
          workspaceId: this.workspaceId,
          content: { id: Number(textId), text: '' },
          tileConfig: textTileConfig,
          type: TileType.TEXT
        };

        textTileElement.addContent(tileObject, this);
        // this.openTextPanelCarmelo(textId, title)
      });

    const element = componentRef.location.nativeElement;

    let corpusExplorerTileConfig = {
      id: ecPanelId,
      container: this.workspaceContainer,
      content: element,
      headerTitle: 'Esplora Corpus',
      maximizedMargin: 5,
      dragit: { snap: true },
      syncMargins: true,
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        //currentWorkspaceInstance.openPanels.delete(panel.id);
        this.deleteTileContent(panel.id, TileType.TEXT);
      },
      onfronted: function (this: any, panel: any, status: any) {
        componentRef.instance.reload()
      }
    };

    let corpusTileElement = jsPanel.create(corpusExplorerTileConfig);

    corpusTileElement
      .resize({
        height: window.innerHeight / 2
      })
      .reposition();
    //.addToPanelsMap();
  }

  openTextChoicePanel(event: any) {

    const textList = this.retrieveTextList();

    const element = this.workspaceTextSelectorComponentToHtml(textList);
    //this.mainPanel.content.append(element);

    var modal = jsPanel.modal.create({
      id: 'modalTextSelect',
      theme: 'filleddark',
      headerTitle: '',
      content: element,
      onclosed: function (panel: any, closedByUser: boolean) {
        //currentWorkspaceInstance.openPanels.delete(panel.id);
      }
    })
      .resize({
        width: window.innerWidth / 2,
        height: window.innerHeight / 2
      })
      .reposition(); // reposition panel in order to maintain centered position
    //.addToPanelsMap();
    //this.panels.set(modal.id, modal);
  }

  retrieveTextList(): TextChoice[] {
    var textList: Array<TextChoice> = [];

    this.workspaceService.retrieveTextChoiceList().subscribe(data => {
      //data.forEach(el => textList.push({title:el.title, status:el.status, createdBy: el.createdBy, updatedOn:el.updatedOn}))
      //textList=data;
      //textList = JSON.parse(JSON.stringify(data));
      data.forEach(el => textList.push(el))
    });

    return textList;
  }

  //Componente creato in maniera dinamica,
  //con gestione manuale degli input e degli eventi
  workspaceTextSelectorComponentToHtml(textList: Array<any>) {
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

  openTextPanel(textId: number, title: string) {
    jsPanel.getPanels(function (this: any) {
      return this.classList.contains('jsPanel-modal');
    })
      .find((x: { id: string; }) => x.id === 'modalTextSelect')
      .close();



    var panelId = this.textTilePrefix + textId

    var panelExist = jsPanel.getPanels().find(
      (x: { id: string; }) => x.id === panelId
    );

    if (panelExist) {
      panelExist.front()
      return;
    }
    // const documentList = this.retrieveTextList();

    const componentRef = this.vcr.createComponent(WorkspaceTextWindowComponent);
    componentRef.instance.textId = textId;
    const element = componentRef.location.nativeElement;


    let textTileConfig = {
      id: panelId,
      container: this.workspaceContainer,
      headerTitle: 'testo - ' + title.toLowerCase(),
      content: element,
      maximizedMargin: 5,
      dragit: { snap: true },
      syncMargins: true,
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        //currentWorkspaceInstance.openPanels.delete(panel.id);
        //this.deleteTileContent(panel.id, TileType.TEXT);
      },
      onfronted: function (this: any, panel: any, status: any) {
        //componentRef.instance.reload()
      }
    };

    let textTileElement = jsPanel.create(textTileConfig);

    textTileElement
      .resize({
        height: window.innerHeight / 2,
        width: window.innerWidth / 3
      })
      .reposition();

    //.addToPanelsMap();

    /*     textTile.options.onclosed.push(function (this: any, panel: any, closedByUser: boolean) {
          currentWorkspaceInstance.openPanels.delete(panel.id);
          this.deleteTileContent(panel.id, TileType.TEXT);
        }); */

    // let tileObject: Tile<TextTileContent> =
    // {
    //   id: undefined,
    //   workspaceId: this.workspaceId,
    //   content: { id: Number(textId), text: '' },
    //   tileConfig: textTileConfig,
    //   type: TileType.TEXT
    // };

    // textTileElement.addContent(tileObject, this);
  }

  openTextPanelCarmelo(textId: string, title: string) {
    //this.openPanels.get('modalTextSelect').close();
    jsPanel.getPanels(function (this: any) {
      return this.classList.contains('jsPanel-modal');
    })
      .find((x: { id: string; }) => x.id === 'modalTextSelect')
      .close();

    let textTileConfig = {
      id: this.textTilePrefix + textId,
      container: this.workspaceContainer,
      headerTitle: 'testo - ' + title.toLowerCase(),
      maximizedMargin: 5,
      dragit: { snap: true },
      syncMargins: true,
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        //currentWorkspaceInstance.openPanels.delete(panel.id);
        this.deleteTileContent(panel.id, TileType.TEXT);
      }
    };

    let textTileElement = jsPanel.create(textTileConfig);
    //.addToPanelsMap();

    /*     textTile.options.onclosed.push(function (this: any, panel: any, closedByUser: boolean) {
          currentWorkspaceInstance.openPanels.delete(panel.id);
          this.deleteTileContent(panel.id, TileType.TEXT);
        }); */

    let tileObject: Tile<TextTileContent> =
    {
      id: undefined,
      workspaceId: this.workspaceId,
      content: { id: Number(textId), text: '' },
      tileConfig: textTileConfig,
      type: TileType.TEXT
    };

    textTileElement.addContent(tileObject, this);
  }
}

