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

var currentWorkspaceInstance: any;

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit, AfterViewInit {

  private newId = 'new';
  private newWorkspace = false;

  private workSaved = false;
  //private mainPanel: any;
  private openPanels: Map<string, any> = new Map();
  private workspaceContainer = "#panelsContainer";

  public items: MenuItem[] = [];

  private storedData: any;
  private storedTiles: Map<string, any> = new Map();
  private storageName = "storedTiles";

  constructor(private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private vcr: ViewContainerRef,
    private workspaceService: WorkspaceService) { }

  ngOnInit(): void {

    this.activeRoute.paramMap.subscribe(params => {

      var id = params.get('id');

      if (id === this.newId) {
        this.newWorkspace = true;
        return;
      }

      if (id != null && id != undefined) {
        this.newWorkspace = false;
        this.workspaceService.loadTiles(id).subscribe(data => {
          //TODO
        });
        return;
      }

      /* this.editUser = false;
      this.loadCurrentUserProfile(); */

    });

    jsPanel.extend({
      //mappa key:idPannello, value: tipo e id del tipo, es. testi, ontologie, lessico.
      panelToTextTileContentMap: new Map<number, Tile<TextTileContent>>(),

      addToPanelsMap: function () {
        currentWorkspaceInstance.openPanels.set(this.id, this);

        return this;
      },
      addTileContent: function (panelId: number, tileContent: any) {
        switch (tileContent.type as TileType) {
          case 0:
            this.panelToTextTileContentMap.set(panelId, tileContent);
            console.log('Added ');
            console.log(this.getPanelToTextTileContentMap())
            break;
          default:
            console.error("type " + tileContent.type + " not implemented");
        }

        return this;
      },
      deleteTileContent: function (panelId: number, type: TileType) {
        switch (type) {
          case TileType.TEXT:
            this.panelToTextTileContentMap.delete(panelId);
            console.log('Deleted ');
            console.log(this.getPanelToTextTileContentMap());
            break;
          default:
            console.error("type ${type} not implemented");
        }

        return this;
      },
      getPanelToTextTileContentMap: function () {
        return this.panelToTextTileContentMap;
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

    for (const [tileId, tileConfig] of this.storedTiles.entries()) {
      tilesConfigs[tileId] = tileConfig;
    }

    console.log(tilesConfigs);

    localStorage.setItem(this.storageName, this.storedData)

    jsPanel.layout.restore({
      configs: tilesConfigs,
      storagename: this.storageName
    });
  }

  saveWork(event: any) {
    console.log(this.openPanels);
    //this.workSaved = true;

    // save panel layout
    this.storedData = jsPanel.layout.save({
      selector: '.jsPanel-standard',
      storagename: this.storageName
    });

    this.storedTiles = new Map(this.openPanels);

    // close panels, here we simply close all panels in the document
    for (const panel of jsPanel.getPanels()) {
      panel.close();
    }

    // for demo purpose only log stored data to the console
    // or use your browser's dev tools to inspect localStorage
    console.log(this.storedData);
  }

  ngAfterViewInit(): void {
    currentWorkspaceInstance = this;
  }

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    //this.mainPanel.close();
    this.openPanels.forEach((panel, id) => panel.close());
    localStorage.removeItem(this.storageName)

    return this.workSaved;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: { target: any; }) {
    //this.mainPanel.maximize();
    console.log('Mappa panels');
    console.log(this.openPanels);
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
        currentWorkspaceInstance.openPanels.delete(panel.id);
      }
    })
      .resize({
        width: window.innerWidth / 2,
        height: window.innerHeight / 2
      })
      .reposition() // reposition panel in order to maintain centered position
      .addToPanelsMap();
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
    this.openPanels.get('modalTextSelect').close();

    let textTileConfig = {
      id: 'textTile_' + textId,
      container: this.workspaceContainer,
      headerTitle: 'testo - ' + title.toLowerCase(),
      maximizedMargin: 5,
      dragit: { snap: true },
      syncMargins: true,
      onclosed: function (this: any, panel: any, closedByUser: boolean) {
        currentWorkspaceInstance.openPanels.delete(panel.id);
        this.deleteTileContent(panel.id, TileType.TEXT);
      }
    };

    let textTile = jsPanel.create(textTileConfig)
      .addToPanelsMap();

    /*     textTile.options.onclosed.push(function (this: any, panel: any, closedByUser: boolean) {
          currentWorkspaceInstance.openPanels.delete(panel.id);
          this.deleteTileContent(panel.id, TileType.TEXT);
        }); */

    textTile.addTileContent(textTile.id, textTileConfig);

    console.log("text tile config before: ", textTileConfig);
    
    let el = document.createElement('p');
    this.workspaceService.retrieveText(textId).subscribe(data => {
      el.textContent = data.content ?? '';
      textTile.content.append(el);
      console.log("text tile config after: ", textTileConfig);
    });

  }
}

