import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessageService, TreeNode } from 'primeng/api';
import { Subscription, take } from 'rxjs';
import { DropdownField, SelectButtonField } from 'src/app/models/dropdown-field';
import { FormCore, FormListItem, LexicalEntryOld, LexicalEntryTypeOld, SenseCore, SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconStatistics } from 'src/app/models/lexicon/lexicon-statistics';
import { Morphology } from 'src/app/models/lexicon/morphology.model';
import { OntolexType } from 'src/app/models/lexicon/ontolex-type.model';
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
  /**Sottoscrizione per la gestione del notify */
  private subscription!: Subscription
  /**Nome dell'istanza selezionara (entrata lessicale|forma|senso) */
  private selectedInstanceName!: string;

  /**Tipo di entrata lessicale */
  public selectedType!: LexicalEntryTypeOld; //set su workspace
  /**Nodo dell'albero del lessico selezionato */
  public selectedNode!: TreeNode; //set su workspace
  /**Contiene i nodi visualizzati nell'albero di dettaglio */
  public lexicalEntryTree!: TreeNode<LexicalEntryOld>[]; //set su workspace component
  /**Definisce se visualizzare la label come nome */
  public showLabelName!: boolean; //set su workspace component
  /**Colonne dell'albero dell'entrata lessicale */
  public cols!: {
    field: string,
    header?: string,
    width?: string,
    display?: string
  }[];
  /**Definisce se siamo in caricamento di elementi dell'albero */
  public loading = false;
  /**Messa a disposizione dei tipi di entrata lessicale per il template */
  public LexicalEntryType = LexicalEntryTypeOld;
  /**Definisce se visualizzare il form di editing di un'entrata lessicale */
  public showLexicalEntryEditor = false;
  /**Definisce se visualizzare il form di editing di una forma */
  public showFormEditor = false;
  /**Definisce se visualizzare il form di editing di un senso */
  public showSenseEditor = false;
  /**Identificativo dell'entrata lessicale */
  public lexicalEntryInstanceName = '';
  /**Identificativo della forma */
  public formInstanceName = '';
  /**Identificativo del senso */
  public senseInstanceName = '';

  public panelId!: string;
  panelHeight!: string;

  /**Definisce se ci sono modifiche pendenti dell'entrata lessicale */
  lexicalEntryPendingChanges = false;
  /**Definisce se ci sono modifiche pendenti della forma */
  formPendingChanges = false;
  /**Definisce se ci sono modifiche pendenti del senso */
  sensePendingChanges = false;

  /**Lista delle option per i tipi di entrata lessicale */
  lexicalEntryTypes!: DropdownField[];
  /**Lista delle option per le POS */
  partOfSpeeches!: DropdownField[];
  /**Lista delle option per i valori dello status */
  statusValues!: SelectButtonField[];
  /**Lista delle option per i valori della lingua */
  languageValues!: DropdownField[];
  /**Lista delle option per i tipi di forma */
  formTypes!: DropdownField[];
  /**Lista delle option per i tratti morfologici */
  morphTraitList!: DropdownField[];
  /**Lista dei dati morfologici */
  morphologicalData!: Morphology[];

  /**
   * Costruttore per WorkspaceLexiconEditTileComponent
   * @param lexiconService {LexiconService} servizi per LexO
   * @param commonService {CommonService} servizi di utilizzo comune
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato
   * @param messageService {MessageService} servizi per i messaggi di primeng
   * @param msgConfService {MessageConfigurationService} servizi per la configurazione dei messaggi
   */
  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService,
    private loggedUserService: LoggedUserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per i setting iniziali e per gestire il cambio etichette */
  ngOnInit(): void {
    this.preloadLexicalEntryTypes();
    this.preloadMorphInfos();
    this.preloadStatusTypes();
    this.preloadLanguages();
    this.preloadFormTypes();

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
      if ('option' in res) {
        if (res.option === 'tag_clicked_edit_tile') {
          this.alternateLabelInstanceName();
          this.showLabelName = !this.showLabelName;
        }

        if (res.option === 'lexicon_edit_pending_changes') {
          switch (res.type) {
            case LexicalEntryTypeOld.LEXICAL_ENTRY:
              this.lexicalEntryPendingChanges = res.value;
              break;
            case LexicalEntryTypeOld.FORM:
              this.formPendingChanges = res.value;
              break;
            case LexicalEntryTypeOld.SENSE:
              this.sensePendingChanges = res.value;
              break;
          }
        }
        if (res.option === 'lexicon_edit_update_tree' && res.value === this.lexicalEntryInstanceName) {
          if (res.isRemove) {
            this.onNodeSelect({
              index: undefined,
              node: this.lexicalEntryTree[0],
              originalEvent: null,
              type: 'row'
            });
            this.selectedInstanceName = this.lexicalEntryInstanceName;
            this.selectedType = LexicalEntryTypeOld.LEXICAL_ENTRY;
            this.selectedNode = this.lexicalEntryTree[0];
          }
          this.refreshTreeNode();
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.panelHeight = document.getElementById(this.panelId)!.style.height;
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
   * Metodo che gestisce l'aggiunta di un elemento all'entrata lessicale
   * @param event {MouseEvent} evento di clic
   * @param elementType {LexicalEntryTypeOld} tipi di lexical entry
   */
  onAdd(event: MouseEvent, elementType: LexicalEntryTypeOld) {
    event.stopPropagation(); //prevengo la selezione

    switch (elementType) {
      case LexicalEntryTypeOld.FORMS_ROOT:
        this.addNewForm();
        break;
      case LexicalEntryTypeOld.SENSES_ROOT:
        this.addNewSense();
        break;
    }
  }

  /**
   * Metodo che recupera i sottonodi dell'albero e mappa per la visualizzazione
   * @param event {any} evento emesso su espansione di un nodo
   * @param isNew {boolean} se è un nuovo inserimento
   * @param elementInstanceName {string} identificativo dell'elemento
   */
  onNodeExpand(event: any, isNew?: boolean, elementInstanceName?: string): void {
    this.loading = true; //mostro il caricamento in corso

    switch (event.node.data.type) {
      case LexicalEntryTypeOld.LEXICAL_ENTRY:
        this.lexiconService.getElements(event.node.data.instanceName).subscribe({
          next: (data: any) => {
            const formChildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryTypeOld.FORMS_ROOT);
            const senseChildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryTypeOld.SENSES_ROOT);
            const countFormChildren = data['elements'].find((el: { label: string; }) => el.label === 'form').count;
            const countSenseChildren = data['elements'].find((el: { label: string; }) => el.label === 'sense').count;

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
          error: (error: HttpErrorResponse) => {
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(error.error)) //TODO VALUTARE LA GESTIONE OPPORTUNA
          }
        });
        break;
      case LexicalEntryTypeOld.FORMS_ROOT:
        this.lexiconService.getLexicalEntryForms(event.node.parent.data.instanceName).subscribe({
          next: (data: FormListItem[]) => {
            const mappedChildren: any[] = data.map((val: FormListItem) => ({
              data: {
                name: this.showLabelName ? val['label'] : val.form,
                instanceName: val.form,
                label: val['label'],
                note: val['note'],
                creator: val['creator'],
                creationDate: val['creationDate'] ? new Date(val['creationDate']).toLocaleString() : '',
                lastUpdate: val['lastUpdate'] ? new Date(val['lastUpdate']).toLocaleString() : '',
                status: null,
                type: LexicalEntryTypeOld.FORM,
                sub: this.lexiconService.concatenateMorphology(val['morphology']),
                isCanonical: val.type === 'canonicalForm'
              }
            }));
            const sortedChildren = mappedChildren.sort((a, b) => a.label === b.label ? 0 : (a.label > b.label ? 1 : -1));
            event.node.children = sortedChildren;
            if (isNew) {
              event.node.expanded = true;
              const newFormNode = event.node.children.find((n: any) => n.data.instanceName === elementInstanceName);
              this.selectedNode = newFormNode;
              this.onNodeSelect({ node: newFormNode });
            }
            //refresh the data
            this.lexicalEntryTree = [...this.lexicalEntryTree];

            this.loading = false;
          },
          error: (error: HttpErrorResponse) => {
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(error.error));
          }
        });
        break;
      case LexicalEntryTypeOld.SENSES_ROOT:
        this.lexiconService.getLexicalEntrySenses(event.node.parent.data.instanceName).subscribe({
          next: (data: SenseListItem[]) => {
            event.node.children = data.map((val: SenseListItem) => ({
              data: {
                name: this.showLabelName ? val['label'] : val.sense,
                instanceName: val.sense,
                label: val['label'],
                note: val['note'],
                creator: val['creator'],
                creationDate: val['creationDate'] ? new Date(val['creationDate']).toLocaleString() : '',
                lastUpdate: val['lastUpdate'] ? new Date(val['lastUpdate']).toLocaleString() : '',
                status: null,
                type: LexicalEntryTypeOld.SENSE
              }
            }));
            if (isNew) {
              event.node.expanded = true;
              const newSenseNode = event.node.children.find((n: any) => n.data.instanceName === elementInstanceName);
              this.selectedNode = newSenseNode;
              this.onNodeSelect({ node: newSenseNode })
            }

            //refresh the data
            this.lexicalEntryTree = [...this.lexicalEntryTree];

            this.loading = false;
          },
          error: (error: HttpErrorResponse) => {
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(error.error));
          }
        });
        break;
    }
  }

  /**
   * Metodo che gestisce la selezione di un nodo
   * @param event {any} evento emesso dalla selezione di una riga
   * @returns {void}
   */
  onNodeSelect(event: any) {
    if (event.node.data.type === LexicalEntryTypeOld.FORMS_ROOT || event.node.data.type === LexicalEntryTypeOld.SENSES_ROOT) {
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

  /**
   * Metodo che gestisce l'aggiornamento dell'editor visualizzato
   * @param type {LexicalEntryTypeOld} tipi di lexical entry da visualizzare
   * @param instanceName {any} identificativo
   */
  refreshEditorView(type: LexicalEntryTypeOld, instanceName: any) {
    switch (type) {
      case LexicalEntryTypeOld.LEXICAL_ENTRY:
        this.showLexicalEntryEditor = true;
        this.showFormEditor = false;
        this.showSenseEditor = false;
        this.lexicalEntryInstanceName = instanceName;
        break;
      case LexicalEntryTypeOld.FORM:
        this.showLexicalEntryEditor = false;
        this.showFormEditor = true;
        this.showSenseEditor = false;
        this.formInstanceName = instanceName;
        this.commonService.notifyOther({ option: 'form_selected', value: instanceName, lexEntryId: this.lexicalEntryTree[0].data?.instanceName });
        break;
      case LexicalEntryTypeOld.SENSE:
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

  /**Metodo per l'aggiornamento del nodo visualizzato nella tree table */
  refreshTreeNode() {
    this.lexiconService.getLexicalEntry(this.lexicalEntryInstanceName).pipe(take(1)).subscribe(lexEntry => {
      this.lexicalEntryTree = [{
        data: {
          name: this.showLabelName ? lexEntry.label : lexEntry.lexicalEntry,
          instanceName: lexEntry.lexicalEntry,
          label: lexEntry['label'],
          note: lexEntry['note'],
          creator: lexEntry['creator'],
          creationDate: lexEntry['creationDate'] ? new Date(lexEntry['creationDate']).toLocaleString() : '',
          lastUpdate: lexEntry['lastUpdate'] ? new Date(lexEntry['lastUpdate']).toLocaleString() : '',
          status: lexEntry['status'],
          uri: lexEntry['lexicalEntry'],
          type: LexicalEntryTypeOld.LEXICAL_ENTRY,
          sub: lexEntry['pos']
        },
        children: [{
          data: {
            name: 'form (0)',
            instanceName: '_form_' + lexEntry.lexicalEntry,
            type: LexicalEntryTypeOld.FORMS_ROOT
          }
        },
        {
          data: {
            name: 'sense (0)',
            instanceName: '_sense_' + lexEntry.lexicalEntry,
            type: LexicalEntryTypeOld.SENSES_ROOT
          }
        }]
      }];
    })
  }

  /**
   * @private
   * Metodo per l'aggiunta di una nuova forma all'entrata lessicale
   * @returns {void}
   */
  private addNewForm() {
    const lexEntryId = this.lexicalEntryTree[0].data?.instanceName;
    if (!lexEntryId) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Lexical entry instance name not found'))
      return;
    }
    const loggedUser = this.loggedUserService.currentUser;
    const creatorName = (loggedUser?.name + '.' + loggedUser?.surname).replace(' ', '.');

    this.lexiconService.getNewForm(lexEntryId, creatorName).subscribe({
      next: (res: FormCore) => {
        const formsRootNode = this.lexicalEntryTree[0].children?.find(n => n.data?.type === LexicalEntryTypeOld.FORMS_ROOT);
        this.onNodeExpand({ node: formsRootNode }, true, res.form);
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Nuova forma inserita!'));
        this.commonService.notifyOther({ option: 'lexicon_edit_update_tree' });
      },
      error: (error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(error.error))
      }
    });
  }

  /**
   * @private
   * Metodo per l'aggiunta di un nuovo senso all'entrata lessicale
   * @returns {void}
   */
  private addNewSense() {
    const lexEntryId = this.lexicalEntryTree[0].data?.instanceName;
    if (!lexEntryId) {
      console.error('Lexical entry instance name not found');
      return;
    }
    const loggedUser = this.loggedUserService.currentUser;
    const creatorName = (loggedUser?.name + '.' + loggedUser?.surname).replace(' ', '.');

    this.lexiconService.getNewSense(lexEntryId, creatorName).subscribe({
      next: (res: SenseCore) => {
        const sensesRootNode = this.lexicalEntryTree[0].children?.find(n => n.data?.type === LexicalEntryTypeOld.SENSES_ROOT);
        this.onNodeExpand({ node: sensesRootNode }, true, res.sense);
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Nuovo senso inserito!'));
        this.commonService.notifyOther({ option: 'lexicon_edit_update_tree' });
      },
      error: (error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(error.error));
      }
    });
  }

  /**
   * @private
   * Metodo per il pre-caricamento dei tipi di forma
   */
  private preloadFormTypes(): void {
    this.lexiconService.getFormTypes().pipe(take(1)).subscribe((res: OntolexType[]) => {
      this.formTypes = [
        {
          name: '--none--',
          code: ''
        },
        ...res.map((el: OntolexType) => <DropdownField>{
          name: el.valueLabel,
          code: el.valueId
        })
      ];
    })
  }

  /**
   * @private
   * Metodo per il pre-caricamento delle lingue disponibili
   */
  private preloadLanguages(): void {
    this.lexiconService.getLanguages().pipe(take(1)).subscribe((res: LexiconStatistics[]) => {
      this.languageValues = [
        {
          name: '--none--',
          code: ''
        },
        ...res.map((val: LexiconStatistics) => <DropdownField>{
          name: val.label,
          code: val.label
        })
      ];
    })
  }

  /**
   * @private
   * Metodo per il pre-caricamento dei tipi di entrata lessicale
   */
  private preloadLexicalEntryTypes(): void {
    this.lexiconService.getLexicalEntryTypes().pipe(take(1)).subscribe((res: OntolexType[]) => {
      this.lexicalEntryTypes = res.map((val: OntolexType) => <DropdownField>{
        name: val.valueLabel,
        code: val.valueId
      });
    })
  }

  /**
   * @private
   * Metodo per il pre-caricamento delle informazioni morfologiche
   */
  private preloadMorphInfos(): void {
    this.lexiconService.getMorphology().pipe(take(1)).subscribe((res: Morphology[]) => {
      this.morphologicalData = res;
      this.morphTraitList = [
        {
          name: '--none--',
          code: ''
        },
        ...res.map((el: Morphology) => <DropdownField>{
          name: el.propertyLabel,
          code: el.propertyId
        })
      ]
      this.partOfSpeeches = res.find((el: Morphology) => el.propertyId?.split('#')[1] === 'partOfSpeech')?.propertyValues
        ?.map((propValue: OntolexType) => <DropdownField>{
          name: propValue.valueLabel,
          code: propValue.valueId
        }) || [];
      this.partOfSpeeches = [
        {
          name: '--none--',
          code: ''
        },
        ...this.partOfSpeeches
      ];
    });
  }

  /**
   * @private
   * Metodo per il pre-caricamento dei valori di status
   */
  private preloadStatusTypes(): void {
    this.lexiconService.getStatus().pipe(take(1)).subscribe((res: LexiconStatistics[]) => {
      this.statusValues = res.map((el: LexiconStatistics) => <SelectButtonField>{
        icon: el.label,
        justify: ''
      });
    })
  }

  /**
   * @private
   * Metodo ricorsivo che valuta cosa viene visualizzato nel name del nodo e inverte label e instanceName o viceversa
   * @param node {TreeNode} nodo di cui modificare il name
   */
  private treeTraversalAlternateLabelInstanceName(node: TreeNode): void {
    if (node.data?.name === node.data?.label) {
      node.data.name = node.data?.instanceName;
    } else if (node.data?.name === node.data?.instanceName) {
      node.data.name = node.data?.label;
    }

    if (node.children) {
      node.children.forEach(childNode => {
        this.treeTraversalAlternateLabelInstanceName(childNode);
      });
    }
  }

}
