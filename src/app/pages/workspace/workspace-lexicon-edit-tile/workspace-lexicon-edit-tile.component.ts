import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessageService, TreeNode } from 'primeng/api';
import { Subscription } from 'rxjs';
import { LexicalEntry, LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';

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
  public showLexicalEntryEditor = false;
  /**Definisce se visualizzare il form di editing di una forma */
  public showFormEditor = false;
  /**Definisce se visualizzare il form di editing di un senso */
  public showSenseEditor = false;
  public lexicalEntryInstanceName = '';
  public formInstanceName = '';
  public senseInstanceName = '';

  lexicalEntryPendingChanges: boolean = false;
  formPendingChanges: boolean = false;
  sensePendingChanges: boolean = false;

  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService,
    private loggedUserService: LoggedUserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per i setting iniziali e per gestire il cambio etichette */
  ngOnInit(): void {
    this.selectedInstanceName = this.selectedNode.data.instanceName;
    this.refreshEditorView(this.selectedType, this.selectedInstanceName);

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

      if (res.hasOwnProperty('option') && res.option === 'lexicon_edit_pending_changes') {
        switch (res.type) {
          case LexicalEntryType.LEXICAL_ENTRY:
            this.lexicalEntryPendingChanges = res.value;
            break;
          case LexicalEntryType.FORM:
            this.formPendingChanges = res.value;
            break;
          case LexicalEntryType.SENSE:
            this.sensePendingChanges = res.value;
            break;
        }
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

  onAdd(event: MouseEvent, elementType: LexicalEntryType) {
    event.stopPropagation(); //prevengo la selezione

    switch (elementType) {
      case LexicalEntryType.FORMS_ROOT:
        this.addNewForm();
        break;
      case LexicalEntryType.SENSES_ROOT:
        this.addNewSense();
        break;
    }
  }

  /**
   * Metodo che recupera i sottonodi dell'albero e mappa per la visualizzazione
   * @param event {any} evento emesso su espansione di un nodo
   */
  onNodeExpand(event: any, isNew?: boolean, elementInstanceName?: string): void {
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
            let mappedChildren: any[] = data.map((val: any) => ({
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
            let sortedChildren = mappedChildren.sort((a,b) => a.label===b.label ? 0 :(a.label>b.label? 1 : -1));
            event.node.children = sortedChildren;
            if(isNew) {
              event.node.expanded = true;
              const newFormNode = event.node.children.find((n: any) => n.data.instanceName === elementInstanceName);
              this.selectedNode = newFormNode;
              this.onNodeSelect({node: newFormNode});
            }
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
            if(isNew) {
              event.node.expanded = true;
              const newSenseNode = event.node.children.find((n: any) => n.data.instanceName === elementInstanceName);
              this.selectedNode = newSenseNode;
              this.onNodeSelect({node: newSenseNode})
            }

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

  onNodeSelect(event: any) {
    if (event.node.data.type === LexicalEntryType.FORMS_ROOT || event.node.data.type === LexicalEntryType.SENSES_ROOT) {
      return;
    }
    if (this.lexicalEntryPendingChanges) {
      if (confirm('Ci sono modifiche pendenti, vuoi prima salvare?')) {
        this.commonService.notifyOther({ option: 'lexical_entry_editor_save', value: this.selectedInstanceName });
      }
      this.lexicalEntryPendingChanges = false;
    }
    if (this.formPendingChanges) {
      if (confirm('Ci sono modifiche pendenti, vuoi prima salvare?')) {
        this.commonService.notifyOther({ option: 'form_editor_save', value: this.selectedInstanceName });
      }
      this.formPendingChanges = false;
    }
    if (this.sensePendingChanges) {
      if (confirm('Ci sono modifiche pendenti, vuoi prima salvare?')) {
        this.commonService.notifyOther({ option: 'sense_editor_save', value: this.selectedInstanceName });
      }
      this.sensePendingChanges = false;
    }
    this.selectedInstanceName = event.node.data.instanceName;
    this.selectedType = event.node.data.type;
    this.refreshEditorView(this.selectedType, this.selectedInstanceName);
  }

  refreshEditorView(type: LexicalEntryType, instanceName: any) {
    switch (type) {
      case LexicalEntryType.LEXICAL_ENTRY:
        this.showLexicalEntryEditor = true;
        this.showFormEditor = false;
        this.showSenseEditor = false;
        this.lexicalEntryInstanceName = instanceName;
        break;
      case LexicalEntryType.FORM:
        this.showLexicalEntryEditor = false;
        this.showFormEditor = true;
        this.showSenseEditor = false;
        this.formInstanceName = instanceName;
        this.commonService.notifyOther({ option: 'form_selected', value: instanceName, lexEntryId: this.lexicalEntryTree[0].data?.instanceName });
        break;
      case LexicalEntryType.SENSE:
        this.showLexicalEntryEditor = false;
        this.showFormEditor = false;
        this.showSenseEditor = true;
        this.senseInstanceName = instanceName;
        this.commonService.notifyOther({ option: 'sense_selected', value: instanceName, lexEntryId: this.lexicalEntryTree[0].data?.instanceName });
        break;
      default:
        break;
    }
  }

  private addNewForm() {
    const lexEntryId = this.lexicalEntryTree[0].data?.instanceName;
    if (!lexEntryId) {
      console.error('Lexical entry instance name not found');
      return;
    }
    const loggedUser = this.loggedUserService.currentUser;
    const creatorName = (loggedUser?.name + '.' + loggedUser?.surname).replace(' ', '.');

    this.lexiconService.getNewForm(lexEntryId, creatorName).subscribe({
      next: (res: any) => {
        let formsRootNode = this.lexicalEntryTree[0].children?.find(n => n.data?.type === LexicalEntryType.FORMS_ROOT);
        this.onNodeExpand({ node: formsRootNode }, true, res.formInstanceName);
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Nuova forma inserita!'))
      },
      error: (error: any) => {
        console.error(error);
      }
    });
  }

  private addNewSense() {
    const lexEntryId = this.lexicalEntryTree[0].data?.instanceName;
    if (!lexEntryId) {
      console.error('Lexical entry instance name not found');
      return;
    }
    const loggedUser = this.loggedUserService.currentUser;
    const creatorName = (loggedUser?.name + '.' + loggedUser?.surname).replace(' ', '.');

    this.lexiconService.getNewSense(lexEntryId, creatorName).subscribe({
      next: (res: any) => {
        let sensesRootNode = this.lexicalEntryTree[0].children?.find(n => n.data?.type === LexicalEntryType.SENSES_ROOT);
        this.onNodeExpand({ node: sensesRootNode }, true, res.senseInstanceName);
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Nuovo senso inserito!'));
      },
      error: (error: any) => {
        console.error(error);
      }
    });
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
