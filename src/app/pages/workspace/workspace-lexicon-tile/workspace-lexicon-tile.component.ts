import { Component, OnInit, ViewChild } from '@angular/core';
import { MessageService, SelectItem, TreeNode } from 'primeng/api';
import { Subscription } from 'rxjs';
import { formTypeEnum, LexicalEntryRequest, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntry, LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

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
  public searchIconSpinner: boolean = false;
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
  public selectedNode?: TreeNode;
  /**Sottonodo dell'albero selezionato */
  public selectedSubTree?: TreeNode<LexicalEntry>;
  /**Definisce se è in corso il caricamento */
  public loading: boolean = false;
  /**Definisce se mostrare l'etichetta o il nome dell'entrata */
  public showLabelName?: boolean;
  /**Modalità di ricerca (equals, etc) */
  public searchMode!: searchModeEnum;
  /**Definisce se ci sono filtri pendenti */
  public pendingFilters!: boolean;
  /**Testo cercato */
  public searchTextInput!: string;
  /**Tipo di entrata lessicale */
  public LexicalEntryType = LexicalEntryType;

  /**Lista dei nodi entrata lessicale */
  public results: TreeNode<LexicalEntry>[] = [];

  /**Riferimento all'entrata lessicale nell'albero */ //TODO verificare perché non è chiaro dove sia richiamata
  @ViewChild('lexicalEntry') lexicalEntryTree: any;
  /* @ViewChild('tt') public tt!: TreeTable; */

  /**
   * Costruttore per WorkspaceLexiconTileComponent
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param lexiconService {LexiconService} servizi relativi al lessico
   * @param commonService {CommonService} servizi di uso comune
   */
  constructor(private messageService: MessageService,
    private lexiconService: LexiconService,
    private commonService: CommonService) { }

  /*   ngAfterViewInit() {
      this.tt.onNodeSelect
        .subscribe((event: any) => {
  
        })
    } */

  /**Metodo dell'interfaccia OnDestroy, utilizzato per cancellare la sottoscrizione */
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  /**Metodo dell'interfaccia OnInit, utilizzato per l'inizializzazione di vari aspetti del componente (inizializzazione colonne, sottoscrizione ai common service, etc) */
  ngOnInit(): void {
    this.cols = [
      { field: 'name', header: '', width: '35%', display:'true'},
      { field: 'creator', header: 'Autore', width: '15%', display:'true'},
      { field: 'creationDate', header: 'Data creazione', width: '20%', display:'true'},
      { field: 'lastUpdate', header: 'Data modifica', width: '20%', display:'true'},
      { field: 'status', header: 'Stato', width: '10%', display:'true'},
      { field: 'type', display:'false'},
      { field: 'uri', display:'false'}
    ];

    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if (res.hasOwnProperty('option') && res.option === 'tag_clicked') {
        this.alternateLabelInstanceName();
        this.showLabelName = !this.showLabelName;
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
      next: (data: any) => {
        this.results = [];
        this.results = data['list'].map((val: any) => ({
          data: {
            name: this.showLabelName ? val['label'] : val['lexicalEntryInstanceName'],
            instanceName: val['lexicalEntryInstanceName'],
            label: val['label'],
            creator: val['creator'],
            creationDate: val['creationDate'] ? new Date(val['creationDate']).toLocaleString() : '',
            lastUpdate: val['lastUpdate'] ? new Date(val['lastUpdate']).toLocaleString() : '',
            status: val['status'],
            uri: val['lexicalEntry'],
            type: LexicalEntryType.LEXICAL_ENTRY
          },
          children: [{
            data: {
              name: 'form (0)',
              type: LexicalEntryType.FORMS_ROOT
            }
          },
          {
            data: {
              name: 'sense (0)',
              type: LexicalEntryType.SENSES_ROOT
            }
          }]
        }))
        this.counter = data['totalHits'];

        this.loading = false;
        this.pendingFilters = false;
      },
      error: (error: any) => {

      }
    })
  }

  /**Metodo che, per ogni nodo dell'albero, sostituisce in visualizzazione la sua label con l'instanceName o viceversa */
  alternateLabelInstanceName() {
    this.results.forEach(node => this.treeTraversalAlternateLabelInstanceName(node))
  }

  /**
   * Metodo che gestisce l'espansione di un nodo e il recupero dei sottonodi
   * @param event {any} evento di espansione di un nodo
   */
  onNodeExpand(event: any): void {
    this.loading = true;

    switch (event.node.data.type) {
      case LexicalEntryType.LEXICAL_ENTRY:
        this.lexiconService.getElements(event.node.data.instanceName).subscribe({
          next: (data: any) => {
            let formCildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryType.FORMS_ROOT);
            let senseCildNode = event.node.children.find((el: any) => el.data.type === LexicalEntryType.SENSES_ROOT);
            let countFormChildren = data['elements'].find((el: { label: string; }) => el.label === 'form').count;
            let countSenseChildren = data['elements'].find((el: { label: string; }) => el.label === 'sense').count;

            formCildNode.data.name = `form (${countFormChildren})`;

            if (countFormChildren > 0) {
              formCildNode.children = [{ data: { name: '' } }];
            }

            senseCildNode.data.name = `sense (${countSenseChildren})`;

            if (countSenseChildren > 0) {
              senseCildNode.children = [{ data: { name: '' } }];
            }

            this.loading = false;
          },
          error: (error: any) => { }
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
                creator: val['creator'],
                creationDate: val['creationDate'] ? new Date(val['creationDate']).toLocaleString() : '',
                lastUpdate: val['lastUpdate'] ? new Date(val['lastUpdate']).toLocaleString() : '',
                status: val['status'],
                uri: val['form'],
                type: LexicalEntryType.FORM
              }
            }));
            //refresh the data
            this.results = [...this.results];

            this.loading = false;
          },
          error: () => { }
        })
        break;
      case LexicalEntryType.SENSES_ROOT:
        this.lexiconService.getLexicalEntrySenses(event.node.parent.data.instanceName).subscribe({
          next: (data: any) => {
            event.node.children = data.map((val: any) => ({
              data: {
                name: this.showLabelName ? val['label'] : val['senseInstanceName'],
                instanceName: val['senseInstanceName'],
                label: val['label'],
                creator: val['creator'],
                creationDate: val['creationDate'] ? new Date(val['creationDate']).toLocaleString() : '',
                lastUpdate: val['lastUpdate'] ? new Date(val['lastUpdate']).toLocaleString() : '',
                status: val['status'],
                uri: val['sense'],
                type: LexicalEntryType.SENSE
              }
            }));
            //refresh the data
            this.results = [...this.results];

            this.loading = false;
          },
          error: () => { }
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
  lexicalEntryDoubleClickHandler(event: any) {
/*     if (this.selectedSubTree?.data?.type === LexicalEntryType.FORMS_ROOT ||
      this.selectedSubTree?.data?.type === LexicalEntryType.SENSES_ROOT) {
       this.selectedSubTree!.expanded = !event.node.expanded;//BUG presente nel branch lessico, non funziona perché event non ha node expanded
    } else {
 */      this.commonService.notifyOther({ option: 'onLexiconTreeElementDoubleClickEvent', value: [this.selectedSubTree, this.showLabelName] });
    // }
  }

  /**
   * Metodo che gestisce la deselezione di un nodo
   * @param event {any} evento di deselezione di un nodo
   */
  onNodeUnselect(event: any) {
    console.log('Unselected ' + event.node.data.uri); //TODO vedi branch lexicon
  }

  /**Metodo che aggiorna i parametri di filtro ed esegue un caricamento filtrato delle entrate lessicali */
  filter() {
    this.updateFilterParameters();

    this.loadNodes();
  }

  /**Metodo che resetta i filtri e segnala come siano presenti filtri pendenti (abilitando il bottone di filtro) */
  reset(){
    this.resetFilters();

    this.pendingFilters=true;
  }

  /**Metodo che segnala la presenza di filtri pendenti abilitando il bottone di filtro */
  onChangeFilter() {
    this.pendingFilters = true;
  }

  /**
   * Metodo che gestisce la copia dell'uri di un'entrata lessicale per un successivo utilizzo
   * @param uri {any} l'uri dell'entrata lessicale
   */
  copyUri(uri:any){
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

  /**
   * @private
   * Metodo che resetta i filtri applicati alla ricerca di entrate lessicali
   */
  private resetFilters() {
    //this.counter = 0;
    this.offset = 0;
    this.limit = 500;
    this.searchTextInput = '';
    this.searchMode = searchModeEnum.equals;
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
      next: (languages: any) => {
        this.selectLanguages = [];
        languages.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < languages.length; i++) {
          this.selectLanguages.push({ label: `${languages[i].label}`, value: languages[i].label });
        }
      },
      error: () => { }
    });

    this.lexiconService.getTypes().subscribe({
      next: (types: any) => {
        this.selectTypes = [];
        types.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < types.length; i++) {
          this.selectTypes.push({ label: `${types[i].label}`, value: types[i].label });
        }
      },
      error: () => { }
    });

    this.lexiconService.getAuthors().subscribe({
      next: (authors: any) => {
        this.selectAuthors = [];
        authors.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < authors.length; i++) {
          this.selectAuthors.push({ label: `${authors[i].label}`, value: authors[i].label });
        }
      },
      error: () => { }
    });

    this.lexiconService.getPos().subscribe({
      next: (partOfSpeech: any) => {
        this.selectPartOfSpeech = [];
        partOfSpeech.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < partOfSpeech.length; i++) {
          this.selectPartOfSpeech.push({ label: `${partOfSpeech[i].label}`, value: partOfSpeech[i].label });
        }
      },
      error: () => { }
    })

    this.lexiconService.getStatus().subscribe({
      next: (statuses: any) => {
        this.selectStatuses = [];
        statuses.sort((a: any, b: any) => a.label.localeCompare(b.label))

        for (let i = 0; i < statuses.length; i++) {
          this.selectStatuses.push({ label: `${statuses[i].label}`, value: statuses[i].label });
        }
      },
      error: () => { }
    })

    this.selectEntries = [
      { label: formTypeEnum.entry, value: formTypeEnum.entry },
      { label: formTypeEnum.flexed, value: formTypeEnum.flexed }
    ]
  }

  /*   private initSelectFields() {
      this.lexiconService.getLanguages().subscribe({
        next: (data: any) => {
          this.languages = data;
        },
        error: () => { }
      });
  
      this.lexiconService.getTypes().subscribe({
        next: (data: any) => {
          this.types = data;
        },
        error: () => { }
      });
  
      this.lexiconService.getAuthors().subscribe({
        next: (data: any) => {
          this.authors = data;
        },
        error: () => { }
      });
  
      this.lexiconService.getPos().subscribe({
        next: (data: any) => {
          this.partOfSpeech = data;
        },
        error: () => { }
      })
    } */
}
