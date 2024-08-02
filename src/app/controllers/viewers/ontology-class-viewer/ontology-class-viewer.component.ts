import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'app-ontology-class-viewer',
  templateUrl: './ontology-class-viewer.component.html',
  styleUrls: ['./ontology-class-viewer.component.scss']
})
export class OntologyClassViewerComponent implements OnInit {

  loading: boolean = false;
  nodes!: TreeNode[];
  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loading = true;
    // this.getFiles().then((data) => (this.files = data));
    setTimeout(() => {
      this.nodes = this.initiateNodes();
      this.loading = false;
      this.cd.markForCheck();
  }, 2000);
  }

  initiateNodes(): TreeNode[] {
    return [
        {
            key: '0',
            label: 'Node 0',
            leaf: false
        },
        {
            key: '1',
            label: 'Node 1',
            leaf: false
        },
        {
            key: '2',
            label: 'Node 2',
            leaf: false
        }
    ];
}

onNodeExpand(event: any) {
  if (!event.node.children) {
      this.loading = true;

      setTimeout(() => {
          let _node = { ...event.node };
          _node.children = [];

          for (let i = 0; i < 3; i++) {
              _node.children.push({
                  key: event.node.key + '-' + i,
                  label: 'Lazy ' + event.node.label + '-' + i
              });
          }

          this.nodes[parseInt(event.node.key, 10)] = _node;

          this.loading = false;
          this.cd.markForCheck();
      }, 500);
  }
}

  getFiles() {
    return Promise.resolve(this.getTreeNodesData());
  }
  getTreeNodesData() {
    return [
      {
        key: '0',
        label: 'Documents',
        data: 'Documents Folder',
        icon: 'pi pi-fw pi-inbox',
        children: [
          {
            key: '0-0',
            label: 'Work',
            data: 'Work Folder',
            icon: 'pi pi-fw pi-cog',
            children: [
              { key: '0-0-0', label: 'Expenses.doc', icon: 'pi pi-fw pi-file', data: 'Expenses Document' },
              { key: '0-0-1', label: 'Resume.doc', icon: 'pi pi-fw pi-file', data: 'Resume Document' }
            ]
          },
          {
            key: '0-1',
            label: 'Home',
            data: 'Home Folder',
            icon: 'pi pi-fw pi-home',
            children: [{ key: '0-1-0', label: 'Invoices.txt', icon: 'pi pi-fw pi-file', data: 'Invoices for this month' }]
          }
        ]
      },
      {
        key: '1',
        label: 'Events',
        data: 'Events Folder',
        icon: 'pi pi-fw pi-calendar',
        children: [
          { key: '1-0', label: 'Meeting', icon: 'pi pi-fw pi-calendar-plus', data: 'Meeting' },
          { key: '1-1', label: 'Product Launch', icon: 'pi pi-fw pi-calendar-plus', data: 'Product Launch' },
          { key: '1-2', label: 'Report Review', icon: 'pi pi-fw pi-calendar-plus', data: 'Report Review' }
        ]
      },
      {
        key: '2',
        label: 'Movies',
        data: 'Movies Folder',
        icon: 'pi pi-fw pi-star-fill',
        children: [
          {
            key: '2-0',
            icon: 'pi pi-fw pi-star-fill',
            label: 'Al Pacino',
            data: 'Pacino Movies',
            children: [
              { key: '2-0-0', label: 'Scarface', icon: 'pi pi-fw pi-video', data: 'Scarface Movie' },
              { key: '2-0-1', label: 'Serpico', icon: 'pi pi-fw pi-video', data: 'Serpico Movie' }
            ]
          },
          {
            key: '2-1',
            label: 'Robert De Niro',
            icon: 'pi pi-fw pi-star-fill',
            data: 'De Niro Movies',
            children: [
              { key: '2-1-0', label: 'Goodfellas', icon: 'pi pi-fw pi-video', data: 'Goodfellas Movie' },
              { key: '2-1-1', label: 'Untouchables', icon: 'pi pi-fw pi-video', data: 'Untouchables Movie' }
            ]
          }
        ]
      }
    ];
  }

}
