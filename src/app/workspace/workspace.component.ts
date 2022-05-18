import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, HostListener, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { faPlaneSlash } from '@fortawesome/free-solid-svg-icons';
import { MenuItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { TextChoiceElement } from '../model/text-choice-element.model';
import { UserService } from '../service/user.service';
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
  private panels: Map<string, any> = new Map();
  private workspaceContainer = "#panelsContainer";

  public items: MenuItem[] = [];

  constructor(private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private vcr: ViewContainerRef) { }

  ngOnInit(): void {

    jsPanel.extend({
      addToPanelsMap: function () {
        currentWorkspaceInstance.panels.set(this.id, this);
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
    this.panels.forEach((panel, id) => panel.close());
    return false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: { target: any; }) {
    //this.mainPanel.maximize();
    console.log(this.panels);
  }

  openTextChoicePanel(event: any) {
    var text: TextChoiceElement = {
      title: 'provaTitolo',
      updatedOn: '13/05/2023',
      createdBy: 'mundizza+amministratore@gmail.com',
      status: 'Aperto'
    };

    var text2: TextChoiceElement = {
      title: 'provaTitolo2',
      updatedOn: '13/05/2025',
      createdBy: 'mundizza+utente@gmail.com',
      status: ''
    };

    var textList: Array<TextChoiceElement> = [];
    textList.push(text, text2);

    const element = this.workspaceTextSelectorComponentToHtml(textList);
    //this.mainPanel.content.append(element);

    var modal = jsPanel.modal.create({
      id: 'modalTextSelect',
      theme: 'filleddark',
      headerTitle: '<h3>scegli il testo da aprire</h3>',
      content: element,
      onclosed: function (panel: any, closedByUser: boolean) {
        currentWorkspaceInstance.panels.delete(panel.id);
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

  //Componente creato in maniera dinamica,
  //con gestione manuale degli input e degli eventi
  workspaceTextSelectorComponentToHtml(textList: Array<any>) {
    const componentRef = this.vcr.createComponent(WorkspaceTextSelectorComponent);

    componentRef.instance.textChoiceList = textList;

    componentRef.instance.onTextSelectEvent
      .subscribe(event => {
        console.log(event); this.openTextPanel(event)
      });

    const element = componentRef.location.nativeElement;
    return element;
  }

  openTextPanel(event: any) {
    this.panels.get('modalTextSelect').close();

    var textPanel = jsPanel.create({
      id: 'textPanel1',
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
        currentWorkspaceInstance.panels.delete(panel.id);
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
    this.panels.delete('modalTextSelect')
  }
}

