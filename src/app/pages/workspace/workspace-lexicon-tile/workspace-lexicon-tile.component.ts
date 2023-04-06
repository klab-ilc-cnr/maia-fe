import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MessageService, SelectItem, TreeNode } from 'primeng/api';
import { forkJoin, Observable, Subscription, take } from 'rxjs';
import { formTypeEnum, LexicalEntriesResponse, LexicalEntryRequest, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { FormListItem, LexicalEntryListItem, LexicalEntryOld, LexicalEntryTypeOld, SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconStatistics } from 'src/app/models/lexicon/lexicon-statistics';
import { LEXICAL_ENTRY_RELATIONS } from 'src/app/models/lexicon/lexicon-updater';
import { LexicalEntryUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { OntolexType } from 'src/app/models/lexicon/ontolex-type.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';

@Component({
  selector: 'app-workspace-lexicon-tile',
  templateUrl: './workspace-lexicon-tile.component.html',
  styleUrls: ['./workspace-lexicon-tile.component.scss']
})
export class WorkspaceLexiconTileComponent implements OnInit {

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
  /**Form dei filtri */ //TODO verificare perché non ne trovo l'uso
  public filterForm: any;
  /**Definisce se c'è lo spinner di ricerca in corso */
  public searchIconSpinner = false;
  /**Lista delle lingue selezionabili */
  public selectLanguages!: SelectItem[];
  /**Lista dei tipi selezionabili */
  public selectTypes!: SelectItem[];
  /**Lista degli autori selezionabili */
  public selectAuthors!: SelectItem[];
  /**Lista delle POS selezionabili */
  public selectPartOfSpeech!: SelectItem[];
  /**Lista degli status di lavorazione selezionabili */
  public selectStatuses!: SelectItem[];
  /**Lista del tipo di entrate selezionabili */
  public selectEntries!: SelectItem[];
  /**Lingua selezionata */
  public selectedLanguage: any;
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

  /**Altezza calcolata per lo scroller */
  public scrollHeight!: number;

  public languageItems: [{ label: string, items: any[]}] = [{
    label: 'Languages',
    items: []
  }];

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
    private loggedUserService: LoggedUserService
  ) { }

  //  ngAfterViewInit() {
  // this.tt.onNodeSelect
  //   .subscribe((event: any) => {

  //   })
  // }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per cancellare la sottoscrizione */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**Metodo dell'interfaccia OnInit, utilizzato per l'inizializzazione di vari aspetti del componente (inizializzazione colonne, sottoscrizione ai common service, etc) */
  ngOnInit(): void {
    this.scrollHeight = this.elem.nativeElement.offsetParent.offsetHeight - 203;

    this.cols = [
      { field: 'name', header: '', width: '70%', display: 'true' },
      { field: 'note', width: '10%', display: 'true' },
      { field: 'creator', header: 'Autore', width: '10%', display: 'true' },
      // { field: 'creationDate', header: 'Data creazione', display: 'false' },
      // { field: 'lastUpdate', header: 'Data modifica', display: 'false' },
      { field: 'status', header: 'Stato', width: '10%', display: 'true' },
      // { field: 'type', display: 'false' },
      // { field: 'uri', display: 'false' },
      // { field: 'sub', display: 'false' }
    ];

    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if ('option' in res && res.option === 'tag_clicked') {
        this.alternateLabelInstanceName();
        this.showLabelName = !this.showLabelName;
      }
      if ('option' in res && res.option === 'lexicon_edit_update_tree') {
        this.loadNodes();
      }
    });

    this.searchIconSpinner = false;
    this.showLabelName = true;

    this.resetFilters();
    this.initSelectFields();
    this.updateFilterParameters();

  }

  /**Metodo che esegue il caricamento dei nodi */
  loadNodes() {
    this.loading = true;

    this.lexiconService.getLexicalEntriesList(this.parameters).subscribe({
      next: (data: LexicalEntriesResponse) => {
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
      },
      error: (error: Error) => {
        console.error(error.message)
      }
    })
  }

  /**Metodo che, per ogni nodo dell'albero, sostituisce in visualizzazione la sua label con l'instanceName o viceversa */
  alternateLabelInstanceName() {
    this.results.forEach(node => this.treeTraversalAlternateLabelInstanceName(node))
  }

  /**Metodo che gestisce l'inserimento di una nuova entrata lessicale */
  onAddNewLexicalEntry(language: string) {
    const currentUser = this.loggedUserService.currentUser;
    const creator = currentUser?.name + '.' + currentUser?.surname;
    this.lexiconService.getNewLexicalEntry(creator).pipe(take(1)).subscribe({
      next: lexEntry => {
        const updater: LexicalEntryUpdater = {
          relation: LEXICAL_ENTRY_RELATIONS.ENTRY,
          value: language
        };
        this.lexiconService.updateLexicalEntry('tester', lexEntry.lexicalEntry, updater).pipe(take(1)).subscribe({
          next: () => {
            const successMsg = "Creata una nuova entrata lessicale";
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
            this.searchTextInput = lexEntry.lexicalEntry;
            this.filter();
          },
          error: (error: HttpErrorResponse) => {
            this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error));
          }
        });
      },
      error: (error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error));
      }
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
        this.lexiconService.getElements(event.node.data.instanceName).subscribe({
          next: (data: any) => {
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
          },
          error: (error: Error) => {
            console.error(error.message);
          }
        });
        break;
      case LexicalEntryTypeOld.FORMS_ROOT:
        this.lexiconService.getLexicalEntryForms(event.node.parent.data.instanceName).subscribe({
          next: (data: FormListItem[]) => {
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
                sub: this.lexiconService.concatenateMorphology(val.morphology)
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
          },
          error: (error: Error) => {
            console.error(error.message);
          }
        })
        break;
      case LexicalEntryTypeOld.SENSES_ROOT:
        this.lexiconService.getLexicalEntrySenses(event.node.parent.data.instanceName).subscribe({
          next: (data: SenseListItem[]) => {
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
          },
          error: (error: Error) => {
            console.error(error.message);
          }
        })
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

    this.deleteNodes(nodesToDelete);
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
    forkJoin(httpDelete).pipe(take(1)).subscribe({
      next: () => {
        const successMsg = "Elementi rimossi";
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
        this.loadNodes();
      },
      error: (error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(error.error))
      }
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
   * Metodo che inizializza i valori dei campi select
   */
  private initSelectFields() {
    this.lexiconService.getLanguages().subscribe({
      next: (languages: LexiconStatistics[]) => {
        this.selectLanguages = [];
        languages.sort((a: LexiconStatistics, b: LexiconStatistics) => a.label!.localeCompare(b.label!))

        for (let i = 0; i < languages.length; i++) {
          this.selectLanguages.push({ label: `${languages[i].label}`, value: languages[i].label });
          this.languageItems[0].items.push({
            label: languages[i].label,
            command: () => {
              this.onAddNewLexicalEntry(languages[i].label!);
            }
          })
        }
      },
      error: (error: Error) => { console.error(error.message); }
    });

    this.lexiconService.getTypes().subscribe({
      next: (types: OntolexType[]) => {
        this.selectTypes = [];
        types.sort((a: OntolexType, b: OntolexType) => a.valueLabel!.localeCompare(b.valueLabel!))

        for (let i = 0; i < types.length; i++) {
          this.selectTypes.push({ label: `${types[i].valueLabel}`, value: types[i].valueId });
        }
      },
      error: (error: Error) => { console.error(error.message); }
    });

    this.lexiconService.getAuthors().subscribe({
      next: (authors: any) => {
        this.selectAuthors = [];
        authors.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < authors.length; i++) {
          this.selectAuthors.push({ label: `${authors[i].label}`, value: authors[i].label });
        }
      },
      error: (error: Error) => { console.error(error.message); }
    });

    this.lexiconService.getPos().subscribe({
      next: (partOfSpeech: any) => {
        this.selectPartOfSpeech = [];
        partOfSpeech.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < partOfSpeech.length; i++) {
          this.selectPartOfSpeech.push({ label: `${partOfSpeech[i].label}`, value: partOfSpeech[i].label });
        }
      },
      error: (error: Error) => { console.error(error.message); }
    })

    this.lexiconService.getStatus().subscribe({
      next: (statuses: any) => {
        this.selectStatuses = [];
        statuses.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < statuses.length; i++) {
          this.selectStatuses.push({ label: `${statuses[i].label}`, value: statuses[i].label });
        }
      },
      error: (error: Error) => { console.error(error.message); }
    })

    this.selectEntries = [
      { label: formTypeEnum.entry, value: formTypeEnum.entry },
      { label: formTypeEnum.flexed, value: formTypeEnum.flexed }
    ]
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
