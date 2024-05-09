import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { MessageService, SelectItem, TreeNode } from 'primeng/api';
import { Observable, Subject, catchError, forkJoin, of, switchMap, take, takeUntil, throwError } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { LexicalEntriesResponse, LexicalEntryRequest, formTypeEnum, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { FormListItem, LexicalEntryCore, LexicalEntryListItem, LexicalEntryOld, LexicalEntryTypeOld, LexoLanguage, SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { Namespace } from 'src/app/models/lexicon/namespace.model';
import { OntolexType } from 'src/app/models/lexicon/ontolex-type.model';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-workspace-lexicon-tile',
  templateUrl: './workspace-lexicon-tile.component.html',
  styleUrls: ['./workspace-lexicon-tile.component.scss']
})
export class WorkspaceLexiconTileComponent implements OnInit {
  private readonly unsubscribe$ = new Subject();
  /**Defines whether an element should be hidden/disabled in the demo version */
  demoHide = environment.demoHide;
  isUploadLexiconVisible = false;

  /**Parametri di richiesta di un'entrata lessicale */
  private parameters: LexicalEntryRequest | undefined;

  /**? */
  private offset!: number;
  /**Numero massimo di elementi */
  private limit!: number;

  /**Numero totale entrate lessicali */
  public counter: number | undefined;
  /**Definisce se c'è lo spinner di ricerca in corso */
  public searchIconSpinner = false;
  /**Lista delle lingue selezionabili */
  public selectLanguages!: SelectItem[];
  filteredLanguages$!: Observable<SelectItem[]>;

  /**Lista dei tipi selezionabili */
  public selectTypes$ = this.globalState.lexicalEntryTypes$.pipe(
    switchMap(types => {
      types.sort((a: OntolexType, b: OntolexType) => a.valueLabel!.localeCompare(b.valueLabel!));
      return of(types.map(t => <SelectItem>{ label: t.valueLabel, value: t.valueLabel === 'lexical entry' ? '' : t.valueLabel }));
    }),
  );
  public selectLanguages$ = this.globalState.languages$.pipe(
    switchMap(languages => {
      languages.sort((a: LexoLanguage, b: LexoLanguage) => a.label!.localeCompare(b.label!));
      this.languageItems[0].items = languages.map(l => {
        return {
          label: l.label,
          command: () => {
            // this.onAddNewLexicalEntry(l.label!);
          }
        }
      });
      return of(languages.map(l => <SelectItem>{ label: l.label, value: l.label }));
    }),
  );
  /**Lista degli autori selezionabili */
  public selectAuthors$ = this.globalState.authors$.pipe(
    switchMap(authors => {
      authors.sort((a: any, b: any) => a.label.localeCompare(b.label));
      return of(authors.map((a: any) => <SelectItem>{ label: a.label, value: a.label }));
    }),
  );
  /**Lista delle POS selezionabili */
  public selectPartOfSpeech$ = this.globalState.statisticsPos$.pipe(
    switchMap(partOfSpeech => {
      partOfSpeech.sort((a: any, b: any) => a.label.localeCompare(b.label));
      return of(partOfSpeech.map((pos: any) => <SelectItem>{ label: pos.label, value: pos.label }));
    }),
  );
  /**Lista degli status di lavorazione selezionabili */
  public selectStatuses$ = this.globalState.statisticStatuses$.pipe(
    switchMap(statuses => {
      statuses.sort((a: any, b: any) => a.label.localeCompare(b.label));
      return of(statuses.map((s: any) => <SelectItem>{ label: s.label, value: s.label }));
    }),
  );
  /**Lista del tipo di entrate selezionabili */
  public selectEntries: SelectItem[] = [
    { label: formTypeEnum.entry, value: formTypeEnum.entry },
    { label: formTypeEnum.flexed, value: formTypeEnum.flexed }
  ];
  /**Lingua selezionata */
  public selectedLanguage: any;
  public selectedUploadLanguage: any;
  public selectedUploadPrefix: any;
  public selectedBaseIRI: any;
  /**Tipo selezionato */
  public selectedType: any;
  /**Autore selezionato */
  public selectedAuthor: any;
  /**POS selezionata */
  public selectedPartOfSpeech: any;
  /**Status selezionato */
  public selectedStatus: any;
  /**Tipo di entrata selezionato */
  public selectedEntry!: formTypeEnum;
  /**Lista di colonne della tabella */
  public cols!: any[];
  /**Nodo dell'albero selezionato */
  public selectedNodes: TreeNode[] = [];
  /**Sottonodo dell'albero selezionato */
  public selectedSubTree?: TreeNode<LexicalEntryOld>;
  /**Definisce se è in corso il caricamento */
  public loading = false;
  /**Definisce se mostrare l'etichetta o il nome dell'entrata */
  public showLabelName?: boolean;
  /**Modalità di ricerca (equals, etc) */
  public searchMode!: searchModeEnum;
  public caseSensitive = false;
  /**Definisce se ci sono filtri pendenti */
  public pendingFilters!: boolean;
  /**Testo cercato */
  public searchTextInput!: string;
  /**Messa a disposizione dei tipi di entrata lessicale per il template */
  public LexicalEntryType = LexicalEntryTypeOld;

  /**Lista dei nodi entrata lessicale */
  public results: TreeNode<LexicalEntryOld>[] = [];

  /**Definisce se sono visibili le checkbox nel tree table */
  public isVisibleCheckbox = false;

  /**Riferimento all'entrata lessicale nell'albero */ //TODO verificare perché non è chiaro dove sia richiamata
  @ViewChild('lexicalEntry') lexicalEntryTree: any;

  @ViewChild('lexiconUploaderForm') public lexiconUploaderForm!: NgForm;

  /**Riferimento al popup di conferma cancellazione di un'annotazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  public languageItems: [{ label: string, items: any[] }] = [{
    label: 'Languages',
    items: []
  }];

  namespaceList: Namespace[] = [];
  filteredPrefix!: string[];
  filteredBase!: string[];
  selectedPrefix: any;
  selectedFile!: any;
  _selectedFile!: File;
  isOverwriteLexicon = false;
  inputAuthor!: string;
  isAddLexicalEntryVisible = false;
  /**List of available languages */
  languages: LexoLanguage[] = [];
  pos$ = this.globalState.pos$;
  types$ = this.globalState.lexicalEntryTypes$;
  /**Form to add a new lexical entry */
  addLexEntryForm = new FormGroup({
    lang: new FormControl<string>('', Validators.required),
    label: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    pos: new FormControl<string>('', Validators.required),
    type: new FormControl<string>('', Validators.required)
  });
  get lang() { return this.addLexEntryForm.controls.lang }
  get label() { return this.addLexEntryForm.controls.label }
  get pos() { return this.addLexEntryForm.controls.pos }
  get type() { return this.addLexEntryForm.controls.type }

  /**Defines whether the list of dictionary entries to which a lexical entry is linked is visible */
  isAssociatedDictionariesVisible = false;
  /**Label of the lexical entry whose dictionary entries we require */
  expandedLexicalEntryLabel = '';
  /**ID of the lexical entry whose dictionary entries we require */
  expandedLexicalEntryId = '';
  /**List of dictionary entries to which the lexical entry is linked */
  associatedDictionariesList: any[] = []; //TODO modificare il tipo a string[] una volta pronto il mapping di maia-be

  /* @ViewChild('tt') public tt!: TreeTable; */

  /**
   * Costruttore per WorkspaceLexiconTileComponent
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param lexiconService {LexiconService} servizi relativi al lessico
   * @param commonService {CommonService} servizi di uso comune
   * @param msgConfService {MessageConfigurationService} servizi di configurazione dei messaggi
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato
   * @param globalState {GlobalStateService} services related to the status of the lexicon
   * @param dictionaryService {DictionaryService} services related to the dictionary
   */
  constructor(
    private messageService: MessageService,
    private lexiconService: LexiconService,
    private commonService: CommonService,
    private msgConfService: MessageConfigurationService,
    private loggedUserService: LoggedUserService,
    private globalState: GlobalStateService,
    private dictionaryService: DictionaryService,
  ) { }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per cancellare la sottoscrizione */
  ngOnDestroy() {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
   * Method that updates a field among those displayed in a tree table node
   * @param node {any} the treetable node to be updated
   * @param field {string} type of field to be updated
   * @param newValue {any} new value to be display
   * @returns {boolean} 
   */
  private updateNodeField(node: any, field: string, newValue: any) {
    let result: boolean;
    switch (field) {
      case 'label':
        node.data.label = newValue;
        node.data.name = newValue;
        result = true;
        break;
      case 'pos':
        node.data.sub = newValue;
        result = true;
        break;
      case 'status':
        node.data.status = newValue;
        result = true;
        break;
      default:
        result = false;
        break;
    }
    return result;
  }

  /**
   * Method that searches for the tree table node to modify
   * @param root {any} tree table node (or object with children)
   * @param res {{ option: string, lexicalEntry: string, uri: string, field: string, newValue: any }} updating data
   * @returns {boolean}
   */
  private findAndModifyNode(root: any, res: { option: string, lexicalEntry: string, uri: string, field: string, newValue: any }) {
    if (res.lexicalEntry === res.uri) { //editing a lexical entry
      const editNode = root.children.find((n: any) => n.data.uri === res.uri);
      return this.updateNodeField(editNode, res.field, res.newValue);
    }
    if (root.data?.uri === res.uri) {
      return this.updateNodeField(root, res.field, res.newValue);
    }
    if (!root.children) return false;
    for (const child of root.children) {
      const found = this.findAndModifyNode(child, res);
      if (found) return true;
    }
    return false;
  }

  /**
   * Method that handles changing the data of a tree table node and updating the displayed list
   * @param res {{ option: string, lexicalEntry: string, uri: string, field: string, newValue: any }} updating data
   */
  private lexiconEditTreeData(res: { option: string, lexicalEntry: string, uri: string, field: string, newValue: any }): void {
    this.findAndModifyNode({ children: this.results }, res);
    this.results = [...this.results];
  }

  /**
   * Method that updates the grouping node with the exact number of children
   * @param root root {any} tree table node (or object with children)
   * @param res {{ option: string, instanceName: string, counter: string, children: any }} updating data
   * @returns {boolean}
   */
  private findAndEditGroupingNode(root: any, res: { option: string, instanceName: string, counter: string, children: any }): boolean {
    if (root.data?.instanceName === res.instanceName) {
      root.data.name = root.data.name.replace(/\(\d*\)/, `(${res.counter})`);
      root.children = res.children;
      return true;
    }
    if (!root.children) return false;
    for (const child of root.children) {
      const found = this.findAndEditGroupingNode(child, res);
      if (found) return true;
    }
    return false;
  }

  /**
   * Method that handles changing the data of a tree table grouping node and updating the displayed list
   * @param res {{ option: string, instanceName: string, counter: string, children: any }} updating data
   */
  private updateGroupingNode(res: { option: string, instanceName: string, counter: string, children: any }) {
    this.findAndEditGroupingNode({ children: this.results }, res);
    this.results = [...this.results];
  }

  /**Metodo dell'interfaccia OnInit, utilizzato per l'inizializzazione di vari aspetti del componente (inizializzazione colonne, sottoscrizione ai common service, etc) */
  ngOnInit(): void {
    this.globalState.languages$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(l => {
      this.languages = l;
      this.lang.setValue(this.languages[0].label);
    })
    this.cols = [
      { field: 'name', header: '', width: '60%', display: 'true' },
      { field: 'note', width: '10%', display: 'true' },
      { field: 'isDescribedByLexicographicComponent', header: 'Component', width: '10%', display: 'true' },
      { field: 'creator', header: 'Autore', width: '10%', display: 'true' },
      { field: 'status', header: 'Stato', width: '10%', display: 'true' },
    ];

    this.commonService.notifyObservable$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((res) => {
      switch (res.option) {
        case 'tag_clicked':
          this.alternateLabelInstanceName();
          this.showLabelName = !this.showLabelName;
          break;
        case 'lexicon_edit_update_tree':
          this.loadNodes();
          break;
        case 'lexicon_edit_tree_data':
          this.lexiconEditTreeData(res);
          break;
        case 'lexicon_update_counter':
          this.updateGroupingNode(res);
          break;
        case 'lexentry_dissociated_from_dictionary':
          this.updateIsDescribedByLexicographicComponent(res.lexicalEntry)
          break;
        default:
          break;
      }
    });

    this.searchIconSpinner = false;
    this.showLabelName = true;

    this.resetFilters();
    this.updateFilterParameters();

    this.lexiconService.getNamespaces().pipe(take(1)).subscribe(ns => {
      this.namespaceList = ns;
    });
    this.loadNodes();
  }

  /**Metodo che esegue il caricamento dei nodi */
  loadNodes() {
    this.loading = true;

    this.lexiconService.getLexicalEntriesList(this.parameters).pipe(
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe((data: LexicalEntriesResponse) => {
      this.results = [];
      this.results = data.list.map((val: LexicalEntryListItem) => this.mapLexicalEntryListItemToTreeNode(val));
      this.counter = data.totalHits;

      this.loading = false;
      this.pendingFilters = false;
    });
  }

  /**Metodo che, per ogni nodo dell'albero, sostituisce in visualizzazione la sua label con l'instanceName o viceversa */
  alternateLabelInstanceName() {
    this.results.forEach(node => this.treeTraversalAlternateLabelInstanceName(node))
  }

  filterBase(event: any) {
    const filtered = [];
    const query = event.query;

    for (const namespace of this.namespaceList) {
      if (namespace.base.toLowerCase().includes(query.toLowerCase())) {
        filtered.push(namespace.base);
      }
    }
    this.filteredBase = filtered;
  }

  filterLanguage(event: any) {
    const query = event.query;
    this.filteredLanguages$ = this.selectLanguages$.pipe(
      switchMap(si => {
        const result = si.filter(s => s.label!.toLowerCase().includes(query.toLowerCase()));
        return of(result);
      }),
    );
  }

  filterPrefix(event: any) {
    const filtered = [];
    const query = event.query;

    for (const namespace of this.namespaceList) {
      if (namespace.prefix.toLowerCase().indexOf(query.toLowerCase()) === 0) {
        filtered.push(namespace.prefix)
      }
    }
    this.filteredPrefix = filtered;
  }

  /**Method that handles the creation of a new lexical entry */
  onAddNewLexicalEntry() {
    console.info(this.addLexEntryForm.value);
    const currentUser = this.loggedUserService.currentUser;
    const creator = currentUser?.name + '.' + currentUser?.surname;
    this.lexiconService.createNewLexicalEntry(creator, this.lang.value!, this.label.value!, this.pos.value!, this.type.value!).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe(ne => {
      this.addLexEntryToTreeStructure(ne);
      this.isAddLexicalEntryVisible = false;
    });
  }

  /**Metodo che gestisce la visualizzazione delle checkbox di selezione */
  onChangeSelectionView() {
    this.isVisibleCheckbox = !this.isVisibleCheckbox;
  }

  /**Method that handles cleanup of lexical entry creation form */
  onCloseNewLexEntryDialog() {
    this.addLexEntryForm.reset({
      lang: this.languages[0].label,
      label: '',
      pos: '',
      type: ''
    });
    this.addLexEntryForm.markAsPristine();
    this.addLexEntryForm.markAsUntouched();
  }

  /**
   * Metodo che gestisce l'espansione di un nodo e il recupero dei sottonodi
   * @param event {any} evento di espansione di un nodo
   */
  onNodeExpand(event: any): void {
    this.loading = true;
    const node = event.node;

    switch (event.node.data.type) {
      case LexicalEntryTypeOld.LEXICAL_ENTRY:
        this.lexiconService.getElements(event.node.data.instanceName).pipe(
          catchError((error: HttpErrorResponse) => {
            this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message));
            return throwError(() => new Error(error.error));
          }),
        ).subscribe((data: any) => {
          const formCildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryTypeOld.FORMS_ROOT);
          const senseCildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryTypeOld.SENSES_ROOT);
          const countFormChildren = data['elements'].find((el: { label: string; }) => el.label === 'form').count;
          const countSenseChildren = data['elements'].find((el: { label: string; }) => el.label === 'sense').count;

          formCildNode.data.name = `form (${countFormChildren})`;

          if (countFormChildren > 0) {
            // formCildNode.children = [{ data: { name: '' } }];
            formCildNode.leaf = false;
          }

          senseCildNode.data.name = `sense (${countSenseChildren})`;

          if (countSenseChildren > 0) {
            // senseCildNode.children = [{ data: { name: '' } }];
            senseCildNode.leaf = false;
          }

          this.selectChildNodes(node);

          this.loading = false;
        });
        break;
      case LexicalEntryTypeOld.FORMS_ROOT:
        this.lexiconService.getLexicalEntryForms(event.node.parent.data.instanceName).pipe(
          catchError((error: HttpErrorResponse) => {
            this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message));
            return throwError(() => new Error(error.error));
          }),
        ).subscribe((data: FormListItem[]) => {
          const mappedChildren: any[] = data.map((val: FormListItem) => ({
            data: {
              name: this.showLabelName ? val.label : val.form,
              instanceName: val.form,
              label: val.label,
              note: val.note,
              creator: val.creator,
              creationDate: val.creationDate ? new Date(val.creationDate).toLocaleString() : '',
              lastUpdate: val.lastUpdate ? new Date(val.lastUpdate).toLocaleString() : '',
              status: null,
              uri: val['form'],
              type: LexicalEntryTypeOld.FORM,
              sub: this.lexiconService.concatenateMorphology(val.morphology),
              isCanonical: val.type === 'canonicalForm'
            },
            parent: node
          }));
          const sortedChildren = mappedChildren.sort((a, b) => a.data.label === b.data.label ? 0 : (a.data.label > b.data.label ? 1 : -1));
          event.node.children = sortedChildren;

          this.selectChildNodes(node);

          this.selectedNodes = [...this.selectedNodes]

          //refresh the data
          this.results = [...this.results];

          this.loading = false;
        });
        break;
      case LexicalEntryTypeOld.SENSES_ROOT:
        this.lexiconService.getLexicalEntrySenses(event.node.parent.data.instanceName).pipe(
          catchError((error: HttpErrorResponse) => {
            this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message));
            return throwError(() => new Error(error.error));
          }),
        ).subscribe((data: SenseListItem[]) => {
          event.node.children = data.map((val: SenseListItem) => ({
            data: {
              name: this.showLabelName ? val.definition : val.sense,
              instanceName: val.sense,
              label: val.definition,
              note: val.note,
              creator: val.creator,
              creationDate: val.creationDate ? new Date(val.creationDate).toLocaleString() : '',
              lastUpdate: val.lastUpdate ? new Date(val.lastUpdate).toLocaleString() : '',
              status: null,
              uri: val.sense,
              type: LexicalEntryTypeOld.SENSE
            }
          }));

          this.selectChildNodes(node);

          this.selectedNodes = [...this.selectedNodes];

          //refresh the data
          this.results = [...this.results];

          this.loading = false;
        });
        break;
    }

  }

  /**
   * Metodo che gestisce la selezione di un nodo
   * @param event {any} evento di selezione di un nodo
   */
  onNodeSelect(event: any) {
    console.info('Selected ' + event.node.data.uri);
    this.selectedSubTree = event.node;
  }

  /**
   * Metodo che gestisce il doppio click dell'albero con apertura del pannello di edit
   * @param event {any} evento di doppio click sull'albero
   */
  lexicalEntryDoubleClickHandler(event: any, rowNode: any) {
    /*     if (this.selectedSubTree?.data?.type === LexicalEntryType.FORMS_ROOT ||
          this.selectedSubTree?.data?.type === LexicalEntryType.SENSES_ROOT) {
           this.selectedSubTree!.expanded = !event.node.expanded;//BUG presente nel branch lessico, non funziona perché event non ha node expanded
        } else {
     */
    const node = rowNode?.node;
    if (node?.data?.type === undefined || (node?.data?.type == LexicalEntryTypeOld.FORMS_ROOT || node?.data?.type == LexicalEntryTypeOld.SENSES_ROOT)) {
      return;
    }
    console.info(node)
    this.commonService.notifyOther({ option: 'onLexiconTreeElementDoubleClickEvent', value: [node, this.showLabelName] });
    // }
  }

  /**
   * Metodo che gestisce la deselezione di un nodo
   * @param event {any} evento di deselezione di un nodo
   */
  onNodeUnselect(event: any) {
    console.log('Unselected ' + event.node.data.uri); //TODO vedi branch lexicon
  }

  /**
   * Method that retrieves the dictionary entries to which a lexical entry is linked and displays the corresponding dialog
   * @param lexicalEntry {LexicalEntryOld} lexical entry for which we need linked dictionaries
   */
  onOpenLinkedDictionaries(lexicalEntry: LexicalEntryOld) {
    this.expandedLexicalEntryId = lexicalEntry.instanceName!;
    this.expandedLexicalEntryLabel = lexicalEntry.label!;
    this.dictionaryService.retrieveDictionariesByLexicalEntryId(this.expandedLexicalEntryId).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe((dictionaries: string[]) => {
      this.associatedDictionariesList = dictionaries;
      this.isAssociatedDictionariesVisible = true;
    });
  }

  /**Metodo che gestisce la rimozione dei nodi selezionati */
  onRemoveNodes(): void {
    const filteredSelectedNodes = this.selectedNodes.filter((n: TreeNode<any>) => n.data.type !== LexicalEntryTypeOld.FORMS_ROOT && n.data.type !== LexicalEntryTypeOld.SENSES_ROOT);

    const nodesToDelete: TreeNode<any>[] = [];
    filteredSelectedNodes.forEach(el => {
      if (el.data.type === LexicalEntryTypeOld.LEXICAL_ENTRY ||
        filteredSelectedNodes.findIndex(e => e.data.instanceName === el.parent?.parent?.data.instanceName) === -1) {
        nodesToDelete.push(el);
      }
    });

    this.showDeleteModal(nodesToDelete);

    // this.deleteNodes(nodesToDelete);
  }

  onSelectFile(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files!;

    this._selectedFile = fileList[0];
  }

  onSelectPrefixBaseIRI(value: string, isPrefix: boolean) {
    const namespace = isPrefix ? this.namespaceList.find(ns => ns.prefix === value) : this.namespaceList.find(ns => ns.base === value);
    if (namespace === undefined) {
      return;
    }
    if (isPrefix) {
      this.selectedBaseIRI = namespace.base;
      return;
    }
    this.selectedUploadPrefix = namespace.prefix;
  }

  onUploadNewLexicon(): void {
    const lexUpForm = this.lexiconUploaderForm.value;
    const fileData = new FormData();
    fileData.append('file', this._selectedFile);

    this.lexiconService.uploadConll(lexUpForm['prefix'], lexUpForm['baseIRI'], lexUpForm['author'], lexUpForm['language'].value, lexUpForm['drop'], fileData).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message))
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(
      () => {
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig("Lexicon uploaded"));
        this.filter();
        this.isUploadLexiconVisible = false;
      });
  }

  /**Metodo che aggiorna i parametri di filtro ed esegue un caricamento filtrato delle entrate lessicali */
  filter() {
    this.updateFilterParameters();

    this.loadNodes();
  }

  /**Metodo che resetta i filtri e segnala come siano presenti filtri pendenti (abilitando il bottone di filtro) */
  reset() {
    this.resetFilters();

    this.pendingFilters = true;
    this.filter();
  }

  /**Metodo che segnala la presenza di filtri pendenti abilitando il bottone di filtro */
  onChangeFilter() {
    this.pendingFilters = true;
    this.filter();
  }

  private showDeleteModal(nodesToDelete: TreeNode[]): void {
    const confirmMsg = 'You are about to delete selected lexical entries';
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteNodes(nodesToDelete), 'delete_lex_nodes');
  }

  /**
   * Metodo che gestisce la copia dell'uri di un'entrata lessicale per un successivo utilizzo
   * @param uri {any} l'uri dell'entrata lessicale
   */
  /*   copyUri(uri:any){
      const el = document.createElement("textarea");
      el.value = uri;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      const selected =
        document.getSelection()!.rangeCount > 0
          ? document.getSelection()!.getRangeAt(0)
          : false;
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      if (selected) {
        document.getSelection()!.removeAllRanges();
        document.getSelection()!.addRange(selected);
      }

      this.messageService.add({ severity: 'success', summary: 'Copiato', detail: '', life: 3000 });

    }
   */

  /**
   * Method that inserts the new lexical entry into the tree without refresh
   * @param lexEntry {LexicalEntryCore} the new lexical entry
   */
  private addLexEntryToTreeStructure(lexEntry: LexicalEntryCore) {
    const mappedEntry = this.mapLexicalEntryListItemToTreeNode(lexEntry);
    this.results.push(mappedEntry);
    this.results = [...this.results.sort((a, b) => {
      if (a.data!.label! < b.data!.label!) {
        return -1
      } else if (a.data!.label! > b.data!.label!) {
        return 1
      }
      return 0
    })];
  }

  /**
   * @private
   * Metodo che esegue la rimozione dei nodi selezionati con checkbox
   * @param nodesToDelete {TreeNode<any>[]} nodi selezionati per la rimozione
   */
  private deleteNodes(nodesToDelete: TreeNode<any>[]): void {
    const httpDelete: Observable<string>[] = [];
    nodesToDelete.forEach(tn => {
      switch (tn.data.type) {
        case LexicalEntryTypeOld.LEXICAL_ENTRY:
          httpDelete.push(this.lexiconService.deleteLexicalEntry(tn.data.instanceName));
          break;
        case LexicalEntryTypeOld.FORM:
          httpDelete.push(this.lexiconService.deleteForm(tn.data.instanceName));
          break;
        case LexicalEntryTypeOld.SENSE:
          httpDelete.push(this.lexiconService.deleteLexicalSense(tn.data.instanceName));
          break;
      }
    });
    forkJoin(httpDelete).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error.message));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(() => {
      const successMsg = "Elementi rimossi";
      this.selectedNodes = [];
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
      this.loadNodes();
    });
  }

  /**
 * Method to map a lexical entry from the model received from backend to the one supported by the tree
 * @param item {LexicalEntryListItem} lexical entry item
 * @returns {} a lexical entry tree node
 */
  private mapLexicalEntryListItemToTreeNode(item: LexicalEntryListItem) {
    return {
      data: {
        name: this.showLabelName ? item.label : item.lexicalEntry,
        instanceName: item.lexicalEntry,
        label: item.label,
        note: item['note'],
        creator: item['creator'],
        creationDate: item['creationDate'] ? new Date(item['creationDate']).toLocaleString() : '',
        lastUpdate: item['lastUpdate'] ? new Date(item['lastUpdate']).toLocaleString() : '',
        status: item['status'],
        uri: item['lexicalEntry'],
        type: LexicalEntryTypeOld.LEXICAL_ENTRY,
        sub: item.pos,
        isDescribedByLexicographicComponent: item.isDescribedByLexicographicComponent,
      },
      children: [{
        data: {
          name: 'form (0)',
          instanceName: '_form_' + item.lexicalEntry,
          type: LexicalEntryTypeOld.FORMS_ROOT
        }
      },
      {
        data: {
          name: 'sense (0)',
          instanceName: '_sense_' + item.lexicalEntry,
          type: LexicalEntryTypeOld.SENSES_ROOT
        }
      }]
    }
  }

  /**
   * @private
   * Metodo che resetta i filtri applicati alla ricerca di entrate lessicali
   */
  private resetFilters() {
    //this.counter = 0;
    this.offset = 0;
    this.limit = 12000;
    this.searchTextInput = '';
    this.searchMode = searchModeEnum.startsWith;
    this.selectedLanguage = undefined;
    this.selectedType = undefined;
    this.selectedAuthor = undefined;
    this.selectedPartOfSpeech = undefined;
    this.selectedStatus = undefined;
    this.selectedEntry = formTypeEnum.entry;
    this.pendingFilters = false;
  }

  /**
   * @private
   * Metodo che aggiorna i valori dei campi di filtro, inizializzando ai valori di eventuali selezioni salvate
   */
  private updateFilterParameters() {
    const searchText = this.caseSensitive ? (this.searchTextInput ?? '*') : (this.searchTextInput.toLowerCase() ?? '*');
    this.parameters = {
      text: searchText,
      searchMode: this.searchMode,
      type: this.selectedType ?? '',
      pos: this.selectedPartOfSpeech ?? '',
      formType: this.selectedEntry ?? '',
      author: this.selectedAuthor ?? '',
      lang: this.selectedLanguage ?? '',
      status: this.selectedStatus ?? '',
      offset: this.offset,
      limit: this.limit
    }
  }

  /**
   * @private
   * Metodo che modifica il valore del name di un modo passando da label a instanceName o viceversa
   * @param node {TreeNode} nodo dell'albero delle entrate lessicali
   */
  private treeTraversalAlternateLabelInstanceName(node: TreeNode): void {
    if (node.data?.name === node.data?.label) {
      node.data!.name = node.data?.instanceName;
    }
    else if (node.data?.name === node.data?.instanceName) {
      node.data!.name = node.data?.label;
    }

    if (node.children) {
      node.children.forEach(childNode => {
        this.treeTraversalAlternateLabelInstanceName(childNode);
      });
    }
  }

  /**
   * @private
   * Metodo che gestisce la selezione dei nodi figli del nodo selezionato
   * @param node {TreeNode} nodo selezionato
   */
  private selectChildNodes(node: TreeNode) {
    if (node && node.children && this.selectedNodes?.indexOf(node) !== -1) {
      for (const child of node.children) {
        if (!this.selectedNodes?.includes(child)) {
          this.selectedNodes?.push(child);
        }
        this.selectChildNodes(child);
      }
    }
  }

  private async updateIsDescribedByLexicographicComponent(lexicalEntryId: string) {
    const lexEntryIndex = this.results.findIndex(node => node.data?.instanceName === lexicalEntryId);
    this.dictionaryService.retrieveDictionariesByLexicalEntryId(lexicalEntryId).pipe(
      take(1),
      catchError(() => {
        this.results[lexEntryIndex].data!.isDescribedByLexicographicComponent = false;
        return of([]);
      }),
    ).subscribe((dictionaries: string[]) => {
      this.results[lexEntryIndex].data!.isDescribedByLexicographicComponent = dictionaries.length > 0;
    });
  }

}
