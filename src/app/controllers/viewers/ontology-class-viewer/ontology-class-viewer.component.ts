import { Component, Input, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { OntologyClass } from 'src/app/models/ontology/ontology-class.model';
import { OntologyStatuses } from 'src/app/models/ontology/ontology-statuses.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-ontology-class-viewer',
  templateUrl: './ontology-class-viewer.component.html',
  styleUrls: ['./ontology-class-viewer.component.scss', "../shared.scss"]
})
export class OntologyClassViewerComponent implements OnInit {

  @Input()
  public panelHeight!: number;

  private readonly unsubscribe$ = new Subject();

  public static rootClassId = "http://www.w3.org/2002/07/owl#Thing";
  /**offset point for the item tree */
  public treeHeightOffset: number = 193;
  public loading: boolean = false;
  public cols!: any[];
  /**Nodo dell'albero selezionato */
  public selectedNodes: TreeNode[] = [];
  /**Ontology list to show */
  public results: TreeNode<OntologyClass>[] = [];
  /**Show label or instance name */
  public showLabelName?: boolean;
  /**Show/hide checkbox in tree table */
  public isVisibleCheckbox = false;

  constructor(private commonService: CommonService) { }
  
  ngOnInit(): void {
    this.cols = [
      { field: 'name', header: '', width: '60%', display: 'true' },
      { field: 'creator', header: 'Autore', width: '10%', display: 'true' },
      { field: 'status', header: 'Stato', width: '10%', display: 'true' },
    ];

    this.showLabelName = true;

    this.commonService.notifyObservable$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((res) => {
      switch (res.option) {
        case 'ontology_tag_clicked':
          this.alternateLabelShortId();
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

  /**Traverse tree function that switch label with shortId and vice versa */
  alternateLabelShortId() {
    this.results.forEach(node => this.treeTraversalAlternateLabelShortId(node))
  }

  /**
 * @private
 * Traverse tree function that switch label with shortId and vice versa
 * @param node
 */
  private treeTraversalAlternateLabelShortId(node: TreeNode<OntologyClass>): void {
    if (node.data?.name === node.data?.label) {
      node.data!.name = node.data!.shortId!;
    }
    else if (node.data?.name === node.data?.shortId) {
      node.data!.name = node.data!.label;
    }

    if (node.children) {
      node.children.forEach(childNode => {
        this.treeTraversalAlternateLabelShortId(childNode);
      });
    }
  }

  /**
 * Metodo che gestisce il doppio click dell'albero con apertura del pannello di edit
 * @param event {any} evento di doppio click sull'albero
 */
  doubleClickHandler(event: any, rowNode: any) {
    alert("dobleClick demo");
    // const node = rowNode?.node;
    // if (node?.data?.type === undefined || (node?.data?.type == LexicalEntryTypeOld.FORMS_ROOT || node?.data?.type == LexicalEntryTypeOld.SENSES_ROOT)) {
    //   return;
    // }
    // this.commonService.notifyOther({ option: 'onLexiconTreeElementDoubleClickEvent', value: [node, this.showLabelName] });
    // // }
  }

  /**remove selected nodes */
  //TODO to be implemented
  removeNodes(){
    // console.log(this.selectedNodes);
  }

  /**Metodo che gestisce la visualizzazione delle checkbox di selezione */
  onChangeSelectionView() {
    this.isVisibleCheckbox = !this.isVisibleCheckbox;
  }

  /**
   * load treetable nodes
   * @param event 
   */
  loadNodes(event: unknown) {
    this.loading = true;

    //TODO ELIMINARE TIMEOUT APPENA SARà CREATO IL VERO SERVIZIO BACKEND
    //imitate db connection over a network
    setTimeout(() => {
      this.loading = false;
      this.results = [];

      //FIXME USARE IL VERSO SERVIZIO QUANDO DISPONIBILE
      this.simuleGetDirectSubClasses(OntologyClassViewerComponent.rootClassId).then((dataResults) => {
        for (let i = 0; i < dataResults.length; i++) {
          let nodeData: OntologyClass = {
            id: dataResults[i].id,
            name: dataResults[i].name,
            creator: dataResults[i].creator,
            creationDate: dataResults[i].creationDate,
            lastUpdate: dataResults[i].lastUpdate,
            status: dataResults[i].status,
            label: dataResults[i].label,
            shortId: dataResults[i].shortId,
            children: dataResults[i].children
          };

          let node: TreeNode<OntologyClass> = {
            data: nodeData,
            leaf: nodeData.children === 0
          };

          this.results.push(node);
        }
      });
    }, 1000);
  }

  /**
   * lazy load of treetable nodes on father expand
   * @param event 
   */
  onNodeExpand(event: { node: TreeNode<OntologyClass>; }) {
    this.loading = true;

    //TODO ELIMINARE TIMEOUT APPENA SARà CREATO IL VERO SERVIZIO BACKEND
    setTimeout(() => {
      this.loading = false;
      const node = event.node;

      //FIXME USARE IL VERSO SERVIZIO QUANDO DISPONIBILE
      this.simuleGetDirectSubClasses(node.data!.id).then((dataResults) => {
        for (let i = 0; i < dataResults.length; i++) {
          let nodeData: OntologyClass = {
            id: dataResults[i].id,
            name: dataResults[i].name,
            creator: dataResults[i].creator,
            creationDate: dataResults[i].creationDate,
            lastUpdate: dataResults[i].lastUpdate,
            status: dataResults[i].status,
            label: dataResults[i].label,
            shortId: dataResults[i].shortId,
            children: dataResults[i].children
          };

          if (!node.children) { node.children = []; }

          node.children.push({
            data: nodeData,
            leaf: nodeData.children === 0
          })
        }
      });

      this.results = [...this.results];
    }, 250);

  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  simuleGetDirectSubClasses(nodeId: string) {
    if (nodeId != OntologyClassViewerComponent.rootClassId) {
      return Promise.resolve(this.getTreeNodesChildrenDate());
    }

    return Promise.resolve(this.getTreeNodesRootData());
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  getTreeNodesRootData() {
    let classesResult = [];
    for (let i = 0; i < 20; i++) {
      let shortId = 'testLabel' + Math.floor(Math.random() * 1000) + 1;
      let id = 'http://test.it/#' + shortId;
      let label = 'label' + shortId;
      let name = this.showLabelName ? shortId : label;

      let data = {
        id: id,
        name: name,
        creator: 'a',
        creationDate: new Date().toLocaleString(),
        lastUpdate: new Date().toLocaleString(),
        status: OntologyStatuses.working,
        label: label,
        shortId: shortId,
        children: 2
      };

      classesResult.push(data);
    }
    return classesResult;
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  getTreeNodesChildrenDate() {
    let shortId = 'testLabel' + Math.floor(Math.random() * 1000) + 1;
    let id = 'http://test.it/#' + shortId;
    let label = 'label' + shortId;
    let name = this.showLabelName ? shortId : label;

    let data1 = {
      id: id,
      name: name,
      creator: 'b',
      creationDate: new Date().toLocaleString(),
      lastUpdate: new Date().toLocaleString(),
      status: OntologyStatuses.completed,
      label: label,
      shortId: shortId,
      children: 2
    };

    let data2 = {
      id: id,
      name: name,
      creator: 'c',
      creationDate: new Date().toLocaleString(),
      lastUpdate: new Date().toLocaleString(),
      status: OntologyStatuses.reviewed,
      label: label,
      shortId: shortId,
      children: 0
    };

    return [data1, data2];
  }

}
