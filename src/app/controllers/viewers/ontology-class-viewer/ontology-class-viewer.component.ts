import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { PrimeNGConfig, TreeNode } from 'primeng/api';

@Component({
  selector: 'app-ontology-class-viewer',
  templateUrl: './ontology-class-viewer.component.html',
  styleUrls: ['./ontology-class-viewer.component.scss']
})
export class OntologyClassViewerComponent implements OnInit {

  @Input()
  public panelHeight!: number;

  /**offset point for the item tree */
  public treeHeightOffset: number = 160;
  public loading: boolean = false;
  public files!: TreeNode[];
  public cols!: any[];
  public totalRecords!: number;
  /**Nodo dell'albero selezionato */
  public selectedNodes: TreeNode[] = [];
  /**Lista dei nodi entrata lessicale */
  public results: TreeNode<unknown>[] = [];

  constructor(private primengConfig: PrimeNGConfig) { }

  ngOnInit(): void {
    this.primengConfig.ripple = true;
    this.cols = [
      { field: 'label', header: '', width: '60%', display: 'true' },
      { field: 'creator', header: 'Autore', width: '10%', display: 'true' },
      { field: 'status', header: 'Stato', width: '10%', display: 'true' },
    ];

    //in a production application, retrieve the logical number of rows from a remote datasource
    this.totalRecords = 1000;

    this.loading = true;
  }

  /**
 * Metodo che gestisce il doppio click dell'albero con apertura del pannello di edit
 * @param event {any} evento di doppio click sull'albero
 */
  classDoubleClickHandler(event: any, rowNode: any) {
    alert("dobleClick demo");
    // const node = rowNode?.node;
    // if (node?.data?.type === undefined || (node?.data?.type == LexicalEntryTypeOld.FORMS_ROOT || node?.data?.type == LexicalEntryTypeOld.SENSES_ROOT)) {
    //   return;
    // }
    // this.commonService.notifyOther({ option: 'onLexiconTreeElementDoubleClickEvent', value: [node, this.showLabelName] });
    // // }
  }

  loadNodes(event: unknown) {
    this.loading = true;

    //in a production application, make a remote request to load data using state metadata from event
    //event.first = First row offset
    //event.rows = Number of rows per page
    //event.sortField = Field name to sort with
    //event.sortOrder = Sort order as number, 1 for asc and -1 for dec
    //filters: FilterMetadata object having field as key and filter value, filter matchMode as value

    //imitate db connection over a network
    setTimeout(() => {
      this.loading = false;
      this.files = [];

      for (let i = 0; i < 20; i++) {
        let node = {
          data: {
            label: Math.floor(Math.random() * 1000) + 1 + 'kb',
            creator: 'a',
            status: 'b'
          },
          leaf: false
        };

        this.files.push(node);
      }
    }, 1000);
  }

  onNodeExpand(event: { node: any; }) {
    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      const node = event.node;

      node.children = [
        {
          data: {
            label: Math.floor(Math.random() * 1000) + 1 + 'kb',
            creator: 'File',
            status: node.data.name + ' - 0',
          },
        },
        {
          data: {
            label: Math.floor(Math.random() * 1000) + 1 + 'kb',
            creator: 'File',
            status: node.data.name + ' - 1',
          }
        }
      ];

      this.files = [...this.files];
    }, 250);

  }

}
