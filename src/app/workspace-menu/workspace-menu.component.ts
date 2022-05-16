import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-workspace-menu',
  templateUrl: './workspace-menu.component.html',
  styleUrls: ['./workspace-menu.component.scss']
})
export class WorkspaceMenuComponent implements OnInit {

  constructor() { }

  items: MenuItem[] = [];

  ngOnInit() {
      this.items = [
          {
              label: 'File',
              items: [{
                      label: 'New', 
                      icon: 'pi pi-fw pi-plus',
                      items: [
                          {label: 'Project'},
                          {label: 'Other'},
                      ]
                  },
                  {label: 'Open'},
                  {label: 'Quit'}
              ]
          },
          {
              label: 'Edit',
              icon: 'pi pi-fw pi-pencil',
              items: [
                  {label: 'Delete', icon: 'pi pi-fw pi-trash'},
                  {label: 'Refresh', icon: 'pi pi-fw pi-refresh'}
              ]
          }
      ];
  }

}
