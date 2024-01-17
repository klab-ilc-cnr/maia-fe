import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService, SelectItem, TreeNode } from 'primeng/api';
import { Observable, Subscription, catchError, forkJoin, of, switchMap, take, throwError } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { LexicalEntriesResponse, LexicalEntryRequest, formTypeEnum, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { FormListItem, LexicalEntryListItem, LexicalEntryOld, LexicalEntryTypeOld, LexoLanguage, SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { LEXICAL_ENTRY_RELATIONS, LexicalEntryUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { Namespace } from 'src/app/models/lexicon/namespace.model';
import { OntolexType } from 'src/app/models/lexicon/ontolex-type.model';
import { CommonService } from 'src/app/services/common.service';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-workspace-lexicon-tile',
  templateUrl: './workspace-lexicon-tile.component.html',
  styleUrls: ['./workspace-lexicon-tile.component.scss']
})
export class WorkspaceLexiconTileComponent implements OnInit {
  /**Defines whether an element should be hidden/disabled in the demo version */
  demoHide = environment.demoHide;
  isUploadLexiconVisible = false;

  /**Sottoscrizione usata per la gestione del click sull'icona tag */
  private subscription!: Subscription;
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
      return of(types.map(t => <SelectItem>{ label: t.valueLabel, value: t.valueId }));
    }),
  );
  public selectLanguages$ = this.globalState.languages$.pipe(
    switchMap(languages => {
      languages.sort((a: LexoLanguage, b: LexoLanguage) => a.label!.localeCompare(b.label!));
      this.languageItems[0].items = languages.map(l => {
        return {
          label: l.label,
          command: () => {
            this.onAddNewLexicalEntry(l.label!);
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

  /**Altezza calcolata per lo scroller */
  public scrollHeight!: number;

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

  /* @ViewChild('tt') public tt!: TreeTable; */

  /**
   * Costruttore per WorkspaceLexiconTileComponent
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param lexiconService {LexiconService} servizi relativi al lessico
   * @param commonService {CommonService} servizi di uso comune
   * @param elem {ElementRef} permette l'accesso diretto al DOM
   * @param msgConfService {MessageConfigurationService} servizi di configurazione dei messaggi
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato
   */
  constructor(
    private messageService: MessageService,
    private lexiconService: LexiconService,
    private commonService: CommonService,
    private elem: ElementRef,
    private msgConfService: MessageConfigurationService,
    private loggedUserService: LoggedUserService,
    private globalState: GlobalStateService,
  ) { }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per cancellare la sottoscrizione */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private findAndModifyEntry(root: any, uri: string, newValue: string): boolean {
    if (root.data?.uri === uri) {
      root.data.label = newValue;
      root.data.name = newValue;
      return true;
    }

    if (!root.children) return false;

    for (const child of root.children) {
      const found = this.findAndModifyEntry(child, uri, newValue);
      if (found) return true;
    }
    return false;
  }

  private onLexiconEdiTreeLabel(res: any): void {
    this.findAndModifyEntry({ children: this.results }, res.uri, res.newValue);
    this.results = [...this.results];
  }

  /**Metodo dell'interfaccia OnInit, utilizzato per l'inizializzazione di vari aspetti del componente (inizializzazione colonne, sottoscrizione ai common service, etc) */
  ngOnInit(): void {
    this.scrollHeight = this.elem.nativeElement.offsetParent.offsetHeight - 203;

    this.cols = [
      { field: 'name', header: '', width: '70%', display: 'true' },
      { field: 'note', width: '10%', display: 'true' },
      { field: 'creator', header: 'Autore', width: '10%', display: 'true' },
      { field: 'status', header: 'Stato', width: '10%', display: 'true' },
    ];

    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      switch (res.option) {
        case 'tag_clicked':
          this.alternateLabelInstanceName();
          this.showLabelName = !this.showLabelName;
          break;
        case 'lexicon_edit_update_tree':
          this.loadNodes();
          break;
        case 'lexicon_edit_label':
          this.onLexiconEdiTreeLabel(res);
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
  }

  /**Metodo che esegue il caricamento dei nodi */
  loadNodes() {
    this.loading = true;

    this.lexiconService.getLexicalEntriesList(this.parameters).pipe(
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.message));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe((data: LexicalEntriesResponse) => {
      this.results = [];
      this.results = data.list.map((val: LexicalEntryListItem) => ({
        data: {
          name: this.showLabelName ? val.label : val.lexicalEntry,
          instanceName: val.lexicalEntry,
          label: val.label,
          note: val['note'],
          creator: val['creator'],
          creationDate: val['creationDate'] ? new Date(val['creationDate']).toLocaleString() : '',
          lastUpdate: val['lastUpdate'] ? new Date(val['lastUpdate']).toLocaleString() : '',
          status: val['status'],
          uri: val['lexicalEntry'],
          type: LexicalEntryTypeOld.LEXICAL_ENTRY,
          sub: val.pos
        },
        children: [{
          data: {
            name: 'form (0)',
            instanceName: '_form_' + val.lexicalEntry,
            type: LexicalEntryTypeOld.FORMS_ROOT
          }
        },
        {
          data: {
            name: 'sense (0)',
            instanceName: '_sense_' + val.lexicalEntry,
            type: LexicalEntryTypeOld.SENSES_ROOT
          }
        }]
      }))
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

  /**
   * Method that handles the creation of a new lexical entry
   * @param language {string} selected language code
   */
  onAddNewLexicalEntry(language: string) {
    const currentUser = this.loggedUserService.currentUser;
    const creator = currentUser?.name + '.' + currentUser?.surname;
    this.lexiconService.getNewLexicalEntry(creator).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(lexEntry => {
      const updater: LexicalEntryUpdater = {
        relation: LEXICAL_ENTRY_RELATIONS.ENTRY,
        value: language
      };
      this.lexiconService.updateLexicalEntry(creator, lexEntry.lexicalEntry, updater).pipe(
        take(1),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error));
          return throwError(() => new Error(error.error));
        }),
      ).subscribe(() => {
        const successMsg = "New lexical entry created";
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
        this.loadNodes();
      },
      );
    })
  }

  /**Metodo che gestisce la visualizzazione delle checkbox di selezione */
  onChangeSelectionView() {
    this.isVisibleCheckbox = !this.isVisibleCheckbox;
  }

  /**
   * Metodo che intercetta l'apertura e chiusura del pannello dei filtri e modifica l'altezza dello scroller
   * @param event {boolean} definisce se il pannello dei filtri è aperto o chiuso
   * @returns {void}
   */
  onCollapseChange(event: boolean) {
    if (event) {
      this.scrollHeight = this.elem.nativeElement.offsetParent.offsetHeight - 203;
      return;
    }
    this.scrollHeight = this.elem.nativeElement.offsetParent.offsetHeight - 420;
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
            this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.message));
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
            this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.message));
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
            this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.message));
            return throwError(() => new Error(error.error));
          }),
        ).subscribe((data: SenseListItem[]) => {
          event.node.children = data.map((val: SenseListItem) => ({
            data: {
              name: this.showLabelName ? val.label : val.sense,
              instanceName: val.sense,
              label: val.label,
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
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error))
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
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error));
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
   * @private
   * Metodo che resetta i filtri applicati alla ricerca di entrate lessicali
   */
  private resetFilters() {
    //this.counter = 0;
    this.offset = 0;
    this.limit = 500;
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
    this.parameters = {
      text: this.searchTextInput ?? '*',
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
}
