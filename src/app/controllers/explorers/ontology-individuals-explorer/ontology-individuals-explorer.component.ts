import { Component, Input, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Observable, of, Subject, take, takeUntil } from 'rxjs';
import { EventsConstants } from 'src/app/constants/events-constants';
import { OntologyIndividual } from 'src/app/models/ontology/ontology-individual.model';
import { OntologyStatuses } from 'src/app/models/ontology/ontology-statuses.model';
import { TileType } from 'src/app/models/tile/tile-type.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-ontology-individuals-explorer',
  templateUrl: './ontology-individuals-explorer.component.html',
  styleUrls: ['./ontology-individuals-explorer.component.scss', "../shared.scss"]
})
export class OntologyIndividualsExplorerComponent implements OnInit {
  @Input()
  public panelHeight!: number;

  private readonly unsubscribe$ = new Subject();

  /**offset point for the item tree */
  public treeHeightOffset: number = 193;
  public loading: boolean = false;
  public cols!: any[];
  /**Nodo dell'albero selezionato */
  public selectedNodes: TreeNode[] = [];
  /**Ontology list to show */
  public results: TreeNode<OntologyIndividual>[] = [];
  /**Show label or instance name */
  public showLabelName?: boolean;
  /**Show/hide checkbox in tree table */
  public isVisibleCheckbox = false;

  constructor(private commonService: CommonService
  ) { }

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
        case EventsConstants.ontology_explorer_tag_clicked:
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
  private treeTraversalAlternateLabelShortId(node: TreeNode<OntologyIndividual>): void {
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
 * Mananges double click on a node tree
 * @param event {any} double click event
 */
  doubleClickHandler(event: any, rowNode: any) {
    const node = rowNode?.node;
    if (node?.data?.id === undefined || node?.data?.id === null) {
      return;
    }

    this.commonService.notifyOther({ option: EventsConstants.onOntologyElementDoubleClickEvent, value: [node, TileType.ONTOLOGY_INDIVIDUAL_VIEWER] });
  }

  /**remove selected nodes */
  //TODO to be implemented
  removeNodes() {
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
      this.simuleGetDirectSubProperties(null).pipe(
        take(1),
      ).subscribe({
        next: (dataResults) => {
          for (let i = 0; i < dataResults.length; i++) {
            let nodeData: OntologyIndividual = {
              id: dataResults[i].id,
              name: dataResults[i].name,
              creator: dataResults[i].creator,
              creationDate: dataResults[i].creationDate,
              lastUpdate: dataResults[i].lastUpdate,
              status: dataResults[i].status,
              label: dataResults[i].label,
              shortId: dataResults[i].shortId,
              children: 0
            };

            let node: TreeNode<OntologyIndividual> = {
              data: nodeData,
              leaf: true
            };

            this.results.push(node);
          }
        },
        error: (error) => {
          this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
        }
      });
    }, 1000);
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  simuleGetDirectSubProperties(nodeId?: string | null) : Observable<OntologyIndividual[]> {
    if (nodeId != undefined && nodeId !== null) {
      return of(this.getTreeNodesDataOrObjectProperty(nodeId));
    }

    return of(this.getTreeNodesRootData());
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  getTreeNodesRootData(): Array<OntologyIndividual> {
    let nodesResult = [];
    for (let i = 0; i < 20; i++) {
      let shortId = 'testLabel' + Math.floor(Math.random() * 1000) + 1;
      let id = 'http://test.it/#' + shortId;
      let label = 'label' + shortId;
      let name = this.showLabelName ? shortId : label;

      let data = new OntologyIndividual();
      data.id = id;
      data.name = name;
      data.creator = 'a';
      data.creationDate = new Date().toLocaleString();
      data.lastUpdate = new Date().toLocaleString();
      data.status = OntologyStatuses.working;
      data.label = label;
      data.shortId = shortId;
      data.children = 0;

      nodesResult.push(data);
    }
    return nodesResult;
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  getTreeNodesDataOrObjectProperty(nodeId: string): Array<OntologyIndividual> {
    let shortId = 'testLabel' + Math.floor(Math.random() * 1000) + 1;
    let id = 'http://test.it/#' + shortId;
    let label = 'label' + shortId;
    let name = this.showLabelName ? shortId : label;

    let data1 = new OntologyIndividual();
    data1.id = id;
    data1.name = name;
    data1.creator = 'b';
    data1.creationDate = new Date().toLocaleString();
    data1.lastUpdate = new Date().toLocaleString();
    data1.status = OntologyStatuses.completed;
    data1.label = label;
    data1.shortId = shortId;
    data1.children = 0;

    let data2 = new OntologyIndividual();
    data2.id = id;
    data2.name = name;
    data2.creator = 'c';
    data2.creationDate = new Date().toLocaleString();
    data2.lastUpdate = new Date().toLocaleString();
    data2.status = OntologyStatuses.reviewed;
    data2.label = label;
    data2.shortId = shortId;
    data2.children = 0;

    return [data1, data2];
  }

}
