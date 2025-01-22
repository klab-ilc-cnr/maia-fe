import { Component, Input, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Subject, take, takeUntil } from 'rxjs';
import { EventsConstants } from 'src/app/constants/events-constants';
import { OntologyObjectProperty } from 'src/app/models/ontology/ontology-object-property.model';
import { TileType } from 'src/app/models/tile/tile-type.model';
import { CommonService } from 'src/app/services/common.service';
import { OntologyService } from 'src/app/services/ontology.service';

@Component({
  selector: 'app-ontology-object-property-explorer',
  templateUrl: './ontology-object-property-explorer.component.html',
  styleUrls: ['./ontology-object-property-explorer.component.scss', "../shared.scss"]
})
export class OntologyObjectPropertyExplorerComponent implements OnInit {
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
  public results: TreeNode<OntologyObjectProperty>[] = [];
  /**Show label or instance name */
  public showLabelName?: boolean;
  /**Show/hide checkbox in tree table */
  public isVisibleCheckbox = false;

  constructor(private commonService: CommonService, private ontologyService: OntologyService
  ) { }

  ngOnInit(): void {
    this.cols = [
      { field: 'name', header: '', width: '60%', display: 'true' },
      { field: 'creator', header: 'Autore', width: '10%', display: 'true' },
      { field: 'status', header: 'Stato', width: '10%', display: 'true' },
    ];

    this.showLabelName = false;

    this.commonService.notifyObservable$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((res) => {
      switch (res.option) {
        case EventsConstants.ontology_explorer_tag_clicked:
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

  /**
   * switch label with shortId and vice versa
   * @param node 
   * @returns 
   */
  getName(node: OntologyObjectProperty) {
    if (this.showLabelName && node.label && node.label.length !== 0) {
      return node.label[0].value; //FIXME per ora prendo il primo elemento di label se esiste, successivamente bisognerà gestire il multilanguage
    }

    return node.shortId!;
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

    this.commonService.notifyOther({ option: EventsConstants.onOntologyElementDoubleClickEvent, value: [node, TileType.ONTOLOGY_OBJECT_PROPERTY_VIEWER] });
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

    this.results = [];

    this.ontologyService.getSubProperties('object').pipe(
      take(1),
    ).subscribe({
      next: (dataResults) => {
        for (let i = 0; i < dataResults.length; i++) {

          let node: TreeNode<OntologyObjectProperty> = {
            data: dataResults[i],
            leaf: dataResults[i].children === 0
          };

          this.results.push(node);
        }

        this.results = [...this.results];
        this.loading = false;
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
        this.loading = false;
      }
    });
  }

  /**
   * lazy load of treetable nodes on father expand
   * @param event 
   */
  onNodeExpand(event: { node: TreeNode<OntologyObjectProperty>; }) {
    this.loading = true;

    const node = event.node;

    this.ontologyService.getSubProperties('object', node.data!.id).pipe(
      take(1),
    ).subscribe({
      next: (dataResults) => {
        node.children = [];

        for (let i = 0; i < dataResults.length; i++) {

          if (!node.children) { node.children = []; }

          node.children.push({
            data: dataResults[i],
            leaf: dataResults[i].children === 0
          })
        }

        this.loading = false;
        this.results = [...this.results];
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
        this.loading = false;
      }
    });

    this.results = [...this.results];

  }
}
