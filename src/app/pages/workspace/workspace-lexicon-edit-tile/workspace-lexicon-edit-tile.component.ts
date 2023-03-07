import { Component, OnDestroy, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Subscription } from 'rxjs';
import { LexicalEntry, LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

/**Classe del tile di modifica di un'entrata lessicale */
@Component({
  selector: 'app-workspace-lexicon-edit-tile',
  templateUrl: './workspace-lexicon-edit-tile.component.html',
  styleUrls: ['./workspace-lexicon-edit-tile.component.scss']
})
export class WorkspaceLexiconEditTileComponent implements OnInit, OnDestroy {
  private subscription!: Subscription
  /**Nome dell'istanza selezionara (entrata lessicale|forma|senso) */
  private selectedInstanceName!: any;

  /**Tipo di entrata lessicale */
  public selectedType!: LexicalEntryType; //set su workspace
  /**Nodo dell'albero del lessico selezionato */
  public selectedNode!: TreeNode; //set su workspace
  /**Contiene i nodi visualizzati nell'albero di dettaglio */
  public lexicalEntryTree!: TreeNode<LexicalEntry>[]; //set su workspace component
  /**Definisce se visualizzare la label come nome */
  public showLabelName!: boolean; //set su workspace component
  /**Colonne dell'albero dell'entrata lessicale */
  public cols!: any[];
  /**Definisce se siamo in caricamento di elementi dell'albero */
  public loading: boolean = false;
  /**Messa a disposizione dei tipi di entrata lessicale per il template */
  public LexicalEntryType = LexicalEntryType;
  /**Definisce se visualizzare il form di editing di un'entrata lessicale */
  public showLexicalEntryEditor = true;
  /**Definisce se visualizzare il form di editing di una forma */
  public showFormEditor = false;
  /**Definisce se visualizzare il form di editing di un senso */
  public showSenseEditor = false;
  public lexicalEntryInstanceName = '';


  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService
  ) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per i setting iniziali e per gestire il cambio etichette */
  ngOnInit(): void {
    this.selectedInstanceName = this.selectedNode.data.instanceName;
    this.lexicalEntryInstanceName = this.selectedInstanceName; //TODO soluzione temporanea di test

    this.cols = [
      { field: 'name', header: '', width: '70%', display: 'true' },
      { field: 'note', width: '10%', display: 'true' },
      { field: 'creator', header: 'Autore', width: '10%', display: 'true' },
      { field: 'creationDate', header: 'Data creazione', display: 'false' },
      { field: 'lastUpdate', header: 'Data modifica', display: 'false' },
      { field: 'status', header: 'Stato', width: '10%', display: 'true' },
      { field: 'type', display: 'false' },
      { field: 'sub', display: 'false' }
    ];

    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if (res.hasOwnProperty('option') && res.option === 'tag_clicked_edit_tile') {
        this.alternateLabelInstanceName();
        this.showLabelName = !this.showLabelName;
      }
    });
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per rimuovere eventuali sottoscrizioni */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**Evoca lo switch label-instanceName su tutti i nodi dell'albero visualizzato */
  alternateLabelInstanceName(): void {
    this.lexicalEntryTree.forEach(node => this.treeTraversalAlternateLabelInstanceName(node));
  }

  /**
   * Metodo che recupera i sottonodi dell'albero e mappa per la visualizzazione
   * @param event {any} evento emesso su espansione di un nodo
   */
  onNodeExpand(event: any): void {
    this.loading = true; //mostro il caricamento in corso

    switch (event.node.data.type) {
      case LexicalEntryType.LEXICAL_ENTRY:
        this.lexiconService.getElements(event.node.data.instanceName).subscribe({
          next: (data: any) => {
            let formChildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryType.FORMS_ROOT);
            let senseChildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryType.SENSES_ROOT);
            let countFormChildren = data['elements'].find((el: { label: string; }) => el.label === 'form').count;
            let countSenseChildren = data['elements'].find((el: { label: string; }) => el.label === 'sense').count;

            formChildNode.data.name = `form (${countFormChildren})`;

            if (countFormChildren > 0) {
              formChildNode.children = [{ data: { name: '' } }];
            }

            senseChildNode.data.name = `sense (${countSenseChildren})`;

            if (countSenseChildren > 0) {
              senseChildNode.children = [{ data: { name: '' } }];
            }

            this.loading = false;
          },
          error: (error: any) => {
            console.error(error); //TODO VALUTARE LA GESTIONE OPPORTUNA
          }
        });
        break;
      case LexicalEntryType.FORMS_ROOT:
        this.lexiconService.getLexicalEntryForms(event.node.parent.data.instanceName).subscribe({
          next: (data: any) => {
            event.node.children = data.map((val: any) => ({
              data: {
                name: this.showLabelName ? val['label'] : val['formInstanceName'],
                instanceName: val['formInstanceName'],
                label: val['label'],
                note: val['note'],
                creator: val['creator'],
                creationDate: val['creationDate'] ? new Date(val['creationDate']).toLocaleString() : '',
                lastUpdate: val['lastUpdate'] ? new Date(val['lastUpdate']).toLocaleString() : '',
                status: val['status'],
                type: LexicalEntryType.FORM,
                sub: this.lexiconService.concatenateMorphology(val['morphology'])
              }
            }));
            //refresh the data
            this.lexicalEntryTree = [...this.lexicalEntryTree];

            this.loading = false;
          },
          error: (error: any) => {
            console.error(error);
          }
        });
        break;
      case LexicalEntryType.SENSES_ROOT:
        this.lexiconService.getLexicalEntrySenses(event.node.parent.data.instanceName).subscribe({
          next: (data: any) => {
            console.info(data)
            event.node.children = data.map((val: any) => ({
              data: {
                name: this.showLabelName ? val['label'] : val['senseInstanceName'],
                instanceName: val['senseInstanceName'],
                label: val['label'],
                note: val['note'],
                creator: val['creator'],
                creationDate: val['creationDate'] ? new Date(val['creationDate']).toLocaleString() : '',
                lastUpdate: val['lastUpdate'] ? new Date(val['lastUpdate']).toLocaleString() : '',
                status: val['status'],
                type: LexicalEntryType.SENSE
              }
            }));
            //refresh the data
            this.lexicalEntryTree = [...this.lexicalEntryTree];

            this.loading = false;
          },
          error: (error: any) => {
            console.error(error);
          }
        });
        break;
    }
  }

  /**
   * @private
   * Metodo ricorsivo che valuta cosa viene visualizzato nel name del nodo e inverte label e instanceName o viceversa
   * @param node {TreeNode} nodo di cui modificare il name
   */
  private treeTraversalAlternateLabelInstanceName(node: TreeNode): void {
    if (node.data?.name === node.data?.label) {
      node.data!.name = node.data?.instanceName;
    } else if (node.data?.name === node.data?.instanceName) {
      node.data!.name = node.data?.label;
    }

    if (node.children) {
      node.children.forEach(childNode => {
        this.treeTraversalAlternateLabelInstanceName(childNode);
      });
    }
  }

}
