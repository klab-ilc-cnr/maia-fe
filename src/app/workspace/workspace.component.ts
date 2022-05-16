import { AfterViewInit, ChangeDetectorRef, Component, ComponentFactoryResolver, HostListener, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { UserService } from '../service/user.service';
import { WorkspaceMenuComponent } from '../workspace-menu/workspace-menu.component';
//import * as jsPanel from 'jspanel4';
//import { jsPanel } from 'jspanel4/es6module/jspanel.js';
//import 'jspanel4/es6module/extensions/tooltip/jspanel.tooltip.js';

@Component({
  selector: 'app-workspace',
  templateUrl: './workspace.component.html',
  styleUrls: ['./workspace.component.scss']
})
export class WorkspaceComponent implements AfterViewInit {

  private panel: any;

  constructor(private router: Router,
    private activeRoute: ActivatedRoute,
    private userService: UserService,
    private cd: ChangeDetectorRef,
        private vcr: ViewContainerRef,
        private resolver: ComponentFactoryResolver) { }

  ngAfterViewInit(): void {
    this.panel = jsPanel.create({
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
      .maximize();

    var child = jsPanel.create({
      container: this.panel.content,
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
    });

    let el = document.createElement('p');
    //el.textContent = 'The function has to include code adding the content to the panel.';
    //child.content.append(el);

    this.userService.findAll().subscribe(data => {
      el.textContent = data.map(o => o.name + " " + o.surname + " " + o.email).toString();
      child.content.append(el);
    });


    const factory = this.resolver.resolveComponentFactory(WorkspaceMenuComponent);
    const componentRef = this.vcr.createComponent(factory);
    const element = componentRef.location.nativeElement;
    child.content.append(element);
  }

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm dialog before navigating away
    this.panel.close();
    return false;
  }
}
