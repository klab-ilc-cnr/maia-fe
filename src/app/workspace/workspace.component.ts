import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, HostListener, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { UserService } from '../service/user.service';
import { WorkspaceMenuComponent } from '../workspace-menu/workspace-menu.component';
import { WorkspaceTextSelectorComponent } from '../workspace-text-selector/workspace-text-selector.component';
//import * as jsPanel from 'jspanel4';
//import { jsPanel } from 'jspanel4/es6module/jspanel.js';
//import 'jspanel4/es6module/extensions/tooltip/jspanel.tooltip.js';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements OnInit, AfterViewInit {

  //private mainPanel: any;
  private panels: Array<any> = [];

  public items: MenuItem[] = [];

  constructor(private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private cd: ChangeDetectorRef,
    private vcr: ViewContainerRef,
    private resolver: ComponentFactoryResolver) { }

  ngOnInit(): void {
    this.items = [
      {
        label: 'Testo',
        items: [
          { label: 'Apri', id: 'OPEN', command: (event) => { this.openText2(event) } },
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
    this.panels.forEach(panel => panel.close());
    return false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: { target: any; }) {
    //this.mainPanel.maximize();
  }

  openText2(event: any) {
    var text:any = {
      title: 'provaTitolo',
      updatedOn: '13/05/2023',
      createdBy: 'mundizza+amministratore@gmail.com',
      status: 'Aperto'
      };

      var text2:any = {
        title: 'provaTitolo2',
        updatedOn: '13/05/2025',
        createdBy: 'mundizza+utente@gmail.com',
        status: ''
        };

      var textList : Array<any> = [];
      textList.push(text,text2);

    const factory = this.resolver.resolveComponentFactory(WorkspaceTextSelectorComponent);
    const componentRef = this.vcr.createComponent(factory);
    

    componentRef.instance.textList = textList;
    //componentRef.instance.someObservable.subscribe(val => this.someProp = val);
    const element = componentRef.location.nativeElement;
    //this.mainPanel.content.append(element);

    var modal = jsPanel.modal.create({
      theme: 'filleddark',
      headerTitle: '<h3>scegli il testo da aprire</h3>',
      content: element,
    });
    modal.resize({
      width: window.innerWidth / 2,
      height: window.innerHeight / 2
    })
      .reposition(); // reposition panel in order to maintain centered position
  }

  openText(event: any) {
    var child = jsPanel.create({
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
      container: "#panelsContainer"
    });
    this.panels.push(child);

    let el = document.createElement('p');
    this.userService.findAll().subscribe(data => {
      el.textContent = data.map(o => o.name + " " + o.surname + " " + o.email).toString();
      child.content.append(el);
    });
  }
}
