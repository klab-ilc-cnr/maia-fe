import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessageService, TreeNode } from 'primeng/api';
import { Subscription, take } from 'rxjs';
import { DropdownField, SelectButtonField } from 'src/app/models/dropdown-field';
import { LexicalEntry, LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
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
  private subscription!: Subscription
  /**Nome dell'istanza selezionara (entrata lessicale|forma|senso) */
  private selectedInstanceName!: string;

  /**Tipo di entrata lessicale */
  public selectedType!: LexicalEntryType; //set su workspace
  /**Nodo dell'albero del lessico selezionato */
  public selectedNode!: TreeNode; //set su workspace
  /**Contiene i nodi visualizzati nell'albero di dettaglio */
  public lexicalEntryTree!: TreeNode<LexicalEntry>[]; //set su workspace component
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

  lexicalEntryPendingChanges = false;
  formPendingChanges = false;
  sensePendingChanges = false;

  lexicalEntryTypes!: DropdownField[];
  partOfSpeeches!: DropdownField[];
  statusValues!: SelectButtonField[];
  languageValues!: DropdownField[];
  formTypes!: DropdownField[];
  morphTraitList!: DropdownField[];
  morphologicalData!: Morphology[];

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
        if (res.option === 'lexicon_edit_update_tree' && res.value === this.lexicalEntryInstanceName) {
          if (res.isRemove) {
            this.onNodeSelect({
              index: undefined,
              node: this.lexicalEntryTree[0],
              originalEvent: null,
              type: 'row'
            });
            this.selectedInstanceName = this.lexicalEntryInstanceName;
            this.selectedType = LexicalEntryType.LEXICAL_ENTRY;
            this.selectedNode = this.lexicalEntryTree[0];
          }
          this.refreshTreeNode();
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
            const formChildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryType.FORMS_ROOT);
            const senseChildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryType.SENSES_ROOT);
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
          error: (error: Error) => {
            console.error(error.message); //TODO VALUTARE LA GESTIONE OPPORTUNA
          }
        });
        break;
      case LexicalEntryType.FORMS_ROOT:
        this.lexiconService.getLexicalEntryForms(event.node.parent.data.instanceName).subscribe({
          next: (data: any) => {
            const mappedChildren: any[] = data.map((val: any) => ({
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
          error: (error: Error) => {
            console.error(error.message);
          }
        });
        break;
      case LexicalEntryType.SENSES_ROOT:
        this.lexiconService.getLexicalEntrySenses(event.node.parent.data.instanceName).subscribe({
          next: (data: any) => {
            event.node.children = data.map((val: { [key: string]: string }) => ({
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
          error: (error: Error) => {
            console.error(error.message);
          }
        });
        break;
    }
  }

  onNodeSelect(event: any) {
    console.info(event)
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

  refreshTreeNode() {
    this.lexiconService.getLexicalEntry(this.lexicalEntryInstanceName).pipe(take(1)).subscribe(lexEntry => {
      this.lexicalEntryTree = [{
        data: {
          name: this.showLabelName ? lexEntry['label'] : lexEntry['lexicalEntryInstanceName'],
          instanceName: lexEntry['lexicalEntryInstanceName'],
          label: lexEntry['label'],
          note: lexEntry['note'],
          creator: lexEntry['creator'],
          creationDate: lexEntry['creationDate'] ? new Date(lexEntry['creationDate']).toLocaleString() : '',
          lastUpdate: lexEntry['lastUpdate'] ? new Date(lexEntry['lastUpdate']).toLocaleString() : '',
          status: lexEntry['status'],
          uri: lexEntry['lexicalEntry'],
          type: LexicalEntryType.LEXICAL_ENTRY,
          sub: lexEntry['pos']
        },
        children: [{
          data: {
            name: 'form (0)',
            instanceName: '_form_' + lexEntry['lexicalEntryInstanceName'],
            type: LexicalEntryType.FORMS_ROOT
          }
        },
        {
          data: {
            name: 'sense (0)',
            instanceName: '_sense_' + lexEntry['lexicalEntryInstanceName'],
            type: LexicalEntryType.SENSES_ROOT
          }
        }]
      }];
    })
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
        const formsRootNode = this.lexicalEntryTree[0].children?.find(n => n.data?.type === LexicalEntryType.FORMS_ROOT);
        this.onNodeExpand({ node: formsRootNode }, true, res.formInstanceName);
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Nuova forma inserita!'));
        this.commonService.notifyOther({ option: 'lexicon_edit_update_tree' });
      },
      error: (error: Error) => {
        console.error(error.message);
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
        const sensesRootNode = this.lexicalEntryTree[0].children?.find(n => n.data?.type === LexicalEntryType.SENSES_ROOT);
        this.onNodeExpand({ node: sensesRootNode }, true, res.senseInstanceName);
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Nuovo senso inserito!'));
        this.commonService.notifyOther({ option: 'lexicon_edit_update_tree' });
      },
      error: (error: Error) => {
        console.error(error.message);
      }
    });
  }

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

  private preloadLanguages(): void {
    this.lexiconService.getLanguages().pipe(take(1)).subscribe((res: LexiconStatistics[]) => {
      this.languageValues = res.map((val: LexiconStatistics) => <DropdownField>{
        name: val.label,
        code: val.label
      });
    })
  }

  private preloadLexicalEntryTypes(): void {
    this.lexiconService.getLexicalEntryTypes().pipe(take(1)).subscribe((res: OntolexType[]) => {
      this.lexicalEntryTypes = res.map((val: OntolexType) => <DropdownField>{
        name: val.valueLabel,
        code: val.valueId
      });
    })
  }

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
      this.partOfSpeeches = res.find((el: Morphology) => el.propertyId === 'partOfSpeech')?.propertyValues
        ?.map((propValue: OntolexType) => <DropdownField>{
          name: propValue.valueLabel,
          code: propValue.valueId
        }) || []
    });
  }

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
