import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { PrimeNGConfig, TreeNode } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { ClassStatus, OntologyClass } from 'src/app/models/ontology/ontology-class.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-ontology-class-viewer',
  templateUrl: './ontology-class-viewer.component.html',
  styleUrls: ['./ontology-class-viewer.component.scss']
})
export class OntologyClassViewerComponent implements OnInit {

  @Input()
  public panelHeight!: number;

  private readonly unsubscribe$ = new Subject();

  /**offset point for the item tree */
  public treeHeightOffset: number = 160;
  public loading: boolean = false;
  public cols!: any[];
  /**Nodo dell'albero selezionato */
  public selectedNodes: TreeNode[] = [];
  /**Ontology list to show */
  public results: TreeNode<OntologyClass>[] = [];
  /**Show label or instance name */
  public showLabelName?: boolean;

  constructor(private commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.cols = [
      { field: 'name', header: '', width: '60%', display: 'true' },
      { field: 'creator', header: 'Autore', width: '10%', display: 'true' },
      { field: 'status', header: 'Stato', width: '10%', display: 'true' },
    ];

    this.loading = true;
    this.showLabelName = true;

    this.commonService.notifyObservable$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((res) => {
      switch (res.option) {
        case 'ontology_tag_clicked':
          this.alternateLabelInstanceName();
          this.showLabelName = !this.showLabelName;
          break;
        default:
          break;
      }
    });

  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per cancellare la sottoscrizione */
  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**Metodo che, per ogni nodo dell'albero, sostituisce in visualizzazione la sua label con l'instanceName o viceversa */
  alternateLabelInstanceName() {
    this.results.forEach(node => this.treeTraversalAlternateLabelInstanceName(node))
  }

  /**
 * @private
 * Metodo che modifica il valore del name di un modo passando da label a instanceName o viceversa
 * @param node {TreeNode} nodo dell'albero delle entrate lessicali
 */
  private treeTraversalAlternateLabelInstanceName(node: TreeNode<OntologyClass>): void {
    if (node.data?.name === node.data?.label) {
      node.data!.name = node.data!.shortId!;
    }
    else if (node.data?.name === node.data?.shortId) {
      node.data!.name = node.data!.label;
    }

    if (node.children) {
      node.children.forEach(childNode => {
        this.treeTraversalAlternateLabelInstanceName(childNode);
      });
    }
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

    //imitate db connection over a network
    setTimeout(() => {
      this.loading = false;
      this.results = [];

      for (let i = 0; i < 20; i++) {
        let shortId = 'testLabel'+Math.floor(Math.random() * 1000) + 1;
        let id = 'http://test.it/#'+shortId;
        let label = 'label'+shortId;
        let name = this.showLabelName ? shortId : label;

        let data : OntologyClass = {
          id: id,
          name: name,
          creator: 'a',
          status: ClassStatus.reviewed,
          label: label,
          shortId: shortId,
          children: 2
        };

        let node : TreeNode<OntologyClass> = {
          data: data,
          leaf: data.children === 0
        };

        this.results.push(node);
      }
    }, 1000);
  }

  onNodeExpand(event: { node: TreeNode<OntologyClass>; }) {
    this.loading = true;

    setTimeout(() => {
      this.loading = false;
      const node = event.node;

      let shortId = 'testLabel'+Math.floor(Math.random() * 1000) + 1;
      let id = 'http://test.it/#'+shortId;
      let label = 'label'+shortId;
      let name = this.showLabelName ? shortId : label;

      let data1 : OntologyClass = {
        id: id,
        name: name,
        creator: 'b',
        status: ClassStatus.reviewed,
        label: label,
        shortId: shortId,
        children: 0
      };

      let data2 : OntologyClass = {
        id: id,
        name: name,
        creator: 'c',
        status: ClassStatus.reviewed,
        label: label,
        shortId: shortId,
        children: 0
      };

      node.children = [
        {
          data: data1,
          leaf: data1.children === 0
        },
        {
          data: data2,
          leaf: data2.children === 0
        }
      ];

      this.results = [...this.results];
    }, 250);

  }

}
