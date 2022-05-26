import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, HostListener, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { text } from '@fortawesome/fontawesome-svg-core';
import { faPlaneSlash } from '@fortawesome/free-solid-svg-icons';
import { LoginOptions } from 'angular-oauth2-oidc';
import { MenuItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { TextChoice as TextChoice } from '../model/text-choice-element.model';
import { Tile } from '../model/tile.model';
import { TileType } from '../model/tile-type.model';
import { UserService } from '../services/user.service';
import { WorkspaceService } from '../services/workspace.service';
import { WorkspaceMenuComponent } from '../workspace-menu/workspace-menu.component';
import { WorkspaceTextSelectorComponent } from '../workspace-text-selector/workspace-text-selector.component';
import { TextTileContent } from '../model/text-tile-content.model';
import { ThisReceiver } from '@angular/compiler';

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

  private workSaved = false;
  //private mainPanel: any;
  //private openPanels: Map<string, any> = new Map(); //PROBABILMENTE SI PUò DEPRECARE, USARE STOREDTILES
  private workspaceContainer = "#panelsContainer";

  public items: MenuItem[] = [];

  private storedData: any;
  private storedTiles: Map<string, Tile<any>> = new Map();
  private storageName = "storedTiles";

  constructor(private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private vcr: ViewContainerRef,
    private workspaceService: WorkspaceService) { }

  ngOnInit(): void {

    this.activeRoute.paramMap.subscribe(params => {

      this.workspaceId = params.get('id') ?? undefined;

      if (this.workspaceId === this.newId) {
        this.newWorkspace = true;
        return;
      }

      if (this.workspaceId != null && this.workspaceId != undefined) {
        this.newWorkspace = false;
        this.workspaceService.loadTiles(Number(this.workspaceId)).subscribe(data => {
          //TODO caricare tile dal backend
        });
        return;
      }

      /* this.editUser = false;
      this.loadCurrentUserProfile(); */

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
          case 0:
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
          case 0:
            let el = document.createElement('p');
            workspaceComponent.workspaceService.retrieveText(tile.id).subscribe(data => {
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
      },
      {
        label: 'Ripristina', id: 'RESTORE', command: (event) => { this.restoreTiles(event) }
      }
    ];
  }
  restoreTiles(event: any) {
    console.log('restore');

    const tilesConfigs: any = {};

    //Creazione dinamica oggetto, secondo la struttura richiesta da jsPanel
    for (const [tileId, tile] of this.storedTiles.entries()) {
      tilesConfigs[tileId] = tile.tileConfig;
    }

    console.log('tiles configs', tilesConfigs);

    //TODO Ripristinare lo stato del workspace

    //Ripristino i dati nel localstorage, che verrà letto successivamente da jsPanel
    localStorage.setItem(this.storageName, this.storedData)

    //Ripristino le tile
    jsPanel.layout.restore({
      configs: tilesConfigs,
      storagename: this.storageName
    });

    //Ripristino il contenuto delle tile
    for (const [tileId, tile] of this.storedTiles.entries()) {
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
    this.storedData = jsPanel.layout.save({
      selector: '.jsPanel-standard',
      storagename: this.storageName
    });

    this.storedTiles = new Map(jsPanel.extensions.getTextTileMap()); //PER TEST, POI VERRà PRESO DAL DB

    let openTiles = jsPanel.extensions.getTextTileMap();
    this.workspaceService.saveWorkspaceStatus(Number(this.workspaceId!), this.storedData, openTiles).subscribe();

    // close panels, here we simply close all panels in the document
    for (const panel of jsPanel.getPanels()) {
      panel.close();
    }

    // for demo purpose only log stored data to the console
    // or use your browser's dev tools to inspect localStorage
    console.log('stored data', this.storedData);
  }

  ngAfterViewInit(): void {
    //currentWorkspaceInstance = this;
  }

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    //this.mainPanel.close();
    //this.openPanels.forEach((panel, id) => panel.close());

    //Chiudo tutti i pannelli aperti anche i modal
    jsPanel.getPanels(function (this: any) {
      return this.classList.contains('jsPanel');
    })
      .forEach((panel: { close: () => any; }) => panel.close());

    localStorage.removeItem(this.storageName)

    return this.workSaved;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: { target: any; }) {
    //this.mainPanel.maximize();
    console.log('Mappa panels');
    //console.log(this.openPanels);
    console.log(jsPanel.getPanels());
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

  openTextPanel(textId: string, title: string) {
    //this.openPanels.get('modalTextSelect').close();
    jsPanel.getPanels(function (this: any) {
      return this.classList.contains('jsPanel-modal');
    })
      .find((x: { id: string; }) => x.id === 'modalTextSelect')
      .close();

    let textTileConfig = {
      id: 'textTile_' + textId,
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
      id: textId,
      workspaceId: this.workspaceId,
      content: { text: "" },
      tileConfig: textTileConfig,
      type: TileType.TEXT
    };

    textTileElement.addContent(tileObject, this);
  }
}

