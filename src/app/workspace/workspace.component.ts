import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, HostListener, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { text } from '@fortawesome/fontawesome-svg-core';
import { faPlaneSlash } from '@fortawesome/free-solid-svg-icons';
import { MenuItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { TextChoiceElement as Text } from '../model/text-choice-element.model';
import { UserService } from '../services/user.service';
import { WorkspaceService } from '../services/workspace.service';
import { WorkspaceMenuComponent } from '../workspace-menu/workspace-menu.component';
import { WorkspaceTextSelectorComponent } from '../workspace-text-selector/workspace-text-selector.component';

var currentWorkspaceInstance: any;

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit, AfterViewInit {

  //private mainPanel: any;
  private openPanels: Map<string, any> = new Map();
  private workspaceContainer = "#panelsContainer";

  public items: MenuItem[] = [];

  constructor(private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private vcr: ViewContainerRef,
    private workspaceService: WorkspaceService) { }

  ngOnInit(): void {

    jsPanel.extend({
      addToPanelsMap: function () {
        currentWorkspaceInstance.openPanels.set(this.id, this);
        return this;
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
      }
    ];
  }

  ngAfterViewInit(): void {
    currentWorkspaceInstance = this;
    /*     this.mainPanel = jsPanel.create({
          headerControls: {
            close: "remove",
            maximize: "remove",
            normalize: "remove",
            minimize: "remove",
            smallify: "remove",
            add: {
              html: '<p>Ritorna alla lista</p>',
              name: 'workspaces',
              position: 6,
              handler: (panel: any, control: any) => {
                this.router.navigate(['../workspaces', this.activeRoute]);
              }
            }
          }
          //container: '#layoutcontainer'
        })
          .maximize(); */




  }

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    //this.mainPanel.close();
    this.openPanels.forEach((panel, id) => panel.close());
    return false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: { target: any; }) {
    //this.mainPanel.maximize();
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

  retrieveTextList(): Text[] {
    var textList: Array<Text> = [];

    this.workspaceService.retrieveTexts().subscribe(data => {
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
        let idPanel = event.target.parentElement.id;
        console.log(event.target.getAttribute('data-type')); this.openTextPanel(idPanel)
      });

    const element = componentRef.location.nativeElement;
    return element;
  }

  openTextPanel(idPanel: string) {
    this.openPanels.get('modalTextSelect').close();

    var textPanel = jsPanel.create({
      id: 'textPanel'+idPanel,
      headerTitle:'textPanel'+idPanel,
      //container: this.mainPanel.content,
      position: {
        //my: 'right-bottom',
        //at: 'right-bottom',
        //offsetX: 300,
        offsetY: 0

      },
      maximizedMargin: 5,
      dragit: { snap: true },
      syncMargins: true,
      //content:"<p>test</p>"
      container: this.workspaceContainer,
      onclosed: function (panel: any, closedByUser: boolean) {
        currentWorkspaceInstance.openPanels.delete(panel.id);
      }
    })
      .addToPanelsMap();
    //    this.panels.set(child.id, child);

    let el = document.createElement('p');
    this.userService.findAll().subscribe(data => {
      el.textContent = data.map(o => o.name + " " + o.surname + " " + o.email).toString();
      textPanel.content.append(el);
    });
  }

  onClosedModal() {
    this.openPanels.delete('modalTextSelect')
  }
}

