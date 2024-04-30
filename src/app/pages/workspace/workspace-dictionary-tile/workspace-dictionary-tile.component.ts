import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MenuItem, TreeNode } from 'primeng/api';
import { Observable, Subject, catchError, concat, debounceTime, distinctUntilChanged, last, lastValueFrom, take, takeUntil } from 'rxjs';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { DictionaryListItem } from 'src/app/models/dictionary/dictionary-list-item.model';
import { LexicogEntriesRequest } from 'src/app/models/dictionary/lexicog-entries-request.model';
import { STATUSES, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { GlobalStateService } from 'src/app/services/global-state.service';

export enum DICTIONARY_NODE {
  entry = 'ENTRY',
  lemma = 'LEMMA'
}
@Component({
  selector: 'app-workspace-dictionary-tile',
  templateUrl: './workspace-dictionary-tile.component.html',
  styleUrls: ['./workspace-dictionary-tile.component.scss'],
})
export class WorkspaceDictionaryTileComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  /**Number of rows (nodes) to be retrieved */
  rows = 5000;
  /**Working statuses */
  statuses = Object.values(STATUSES);
  /**List of available languages */
  languages$ = this.globalState.languages$; //FIXME probably to be changed
  /**Body for the http request of the list of dictionary entries */
  lexicogRequest: LexicogEntriesRequest = {
    text: '',
    searchMode: searchModeEnum.startsWith,
    pos: '',
    author: '',
    lang: '',
    status: '',
    offset: 0,
    limit: this.rows
  };
  /**Defines whether loading is in progress */
  loading = false;
  /**Number of vocabulary items retrieved */
  counter!: number;
  /**List of treenodes representing a dictionary entry or a lexicographic component */
  lexicogEntries: TreeNode<DictionaryListItem>[] = [];
  /**Control for the search input text */
  searchTextForm = new FormGroup({
    search: new FormControl<string>('')
  });
  /**Form to manage filters */
  filtersForm = new FormGroup({
    caseSensitive: new FormControl<boolean>(false),
    match: new FormControl<searchModeEnum>(searchModeEnum.startsWith),
    language: new FormControl<string>(''),
    editor: new FormControl<string>(''),
    status: new FormControl<string>('')
  });
  /**Radio buttons for the type of match */
  matchRadioGroup = [
    { name: 'Equals', key: 'equals' },
    { name: 'StartsWith', key: 'startsWith' },
    { name: 'Contains', key: 'contains' },
    { name: 'End', key: 'end' }
  ];
  cols!: any[];
  /**Defines whether to display selection checkboxes */
  isVisibleCheckbox = false;
  /**Defines whether to display the dialog to create a new dictionary entry with or without lemmas */
  isAddDictionaryEntryVisible = false;
  /**Defines whether to display the dialog to add a lemma to a dictionary entry */
  isAddLemmaVisible = false;
  newLemmaTemp?: { lemma: string, pos: string, type: string[], isFromLexicon: boolean };
  entryForLemmaTemp?: DictionaryListItem;

  public selectedNode!: TreeNode;
  items: MenuItem[] = [];
  entryCM: MenuItem[] = [{
    label: this.commonService.translateKey('DICTIONARY_EXPLORER.CONTEXTMENU.delete'),
    icon: 'pi pi-trash',
    command: () => {
      console.info('delete', this.selectedNode)
    },
  }];
  lemmaCM: MenuItem[] = [{
    label: this.commonService.translateKey('DICTIONARY_EXPLORER.CONTEXTMENU.move'),
    icon: 'pi pi-arrows-alt',
    disabled: true, //TODO future enhancement
    command: () => {
      console.info('Move', this.selectedNode)
    },
  },
  {
    label: this.commonService.translateKey('DICTIONARY_EXPLORER.CONTEXTMENU.dissociate'),
    icon: 'pi pi-eraser',
    command: () => {
      console.info('dissociate', this.selectedNode)
    },
  },
  {
    label: this.commonService.translateKey('DICTIONARY_EXPLORER.CONTEXTMENU.delete'),
    icon: 'pi pi-trash',
    command: () => {
      console.info('delete', this.selectedNode)
    },
  }];

  public selectedNodes: TreeNode[] = [];

  constructor(
    private dictionaryService: DictionaryService,
    private commonService: CommonService,
    private globalState: GlobalStateService,
  ) { }

  ngOnInit(): void {
    this.cols = [
      { field: 'label', header: '', width: '70%', display: 'true' },
      { field: 'creator', width: '10%', display: 'true' },
      { field: 'status', header: 'Autore', width: '10%', display: 'true' },
      { field: 'add', header: 'Stato', width: '10%', display: 'true' },
    ];

    this.searchTextForm.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe(() => {
      this.createFilters(true);
    });
    this.filtersForm.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(() => {
      this.createFilters(false);
    });

    this.loadNodes();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  loadContextMenu() {
    if (this.selectedNode.type === DICTIONARY_NODE.entry) {
      this.items = [...this.entryCM];
    } else if (this.selectedNode.type === DICTIONARY_NODE.lemma) {
      this.items = [...this.lemmaCM];
    }
  }

  loadNodes() {
    this.loading = true;
    this.dictionaryService.retrieveLexicogEntryList(this.lexicogRequest).pipe(
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => {
        this.loading = false;
        return this.commonService.throwHttpErrorAndMessage(error, error.error.message);
      }),
    ).subscribe(resp => {
      this.lexicogEntries = resp.list.map(entry => this.mapLexicogEntryToTreenode(entry));
      this.counter = resp.totalHits;
      this.loading = false;
    })
  }

  onAddAssociateLemmas(dictionaryEntry: DictionaryEntry, lemmas: { lemma: string, pos: string, type: string[], isFromLexicon: boolean }[]) {
    const requests: Observable<any>[] = [];
    lemmas.forEach((lemma, i) => {
      const position = i + 1;
      if (lemma.isFromLexicon) {
        requests.push(this.dictionaryService.associateLexEntryWithDictionaryEntry(dictionaryEntry.id, lemma.lemma, position));
      } else {
        requests.push(this.dictionaryService.createAndAssociateLexicalEntry(dictionaryEntry.language, lemma.lemma, lemma.pos, lemma.type, dictionaryEntry.id, position));
      }
    });
    const combinedRequests = concat(...requests);
    combinedRequests.pipe(
      last(),
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => {
        this.loading = false;
        return this.commonService.throwHttpErrorAndMessage(error, error.error.message);
      }),
    ).subscribe(() => {
      this.loadNodes();
    });
  }

  async onAddNewLemma() {
    if (!this.newLemmaTemp || !this.entryForLemmaTemp) {
      console.error('No lemma value to save');
      return;
    }
    let request: Observable<any>;
    let position = 1;
    if (this.entryForLemmaTemp.hasChildren) {
      position = (await lastValueFrom(this.dictionaryService.retrieveComponents(this.entryForLemmaTemp.id).pipe(take(1)))).length + 1;
    }
    if (this.newLemmaTemp?.isFromLexicon) {
      request = this.dictionaryService.associateLexEntryWithDictionaryEntry(this.entryForLemmaTemp.id, this.newLemmaTemp.lemma, position)
    } else {
      request = this.dictionaryService.createAndAssociateLexicalEntry(this.entryForLemmaTemp.language, this.newLemmaTemp.lemma, this.newLemmaTemp.pos, this.newLemmaTemp.type, this.entryForLemmaTemp.id, position);
    }
    request.pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.loading = false;
        return this.commonService.throwHttpErrorAndMessage(error, error.error.message);
      }),
    ).subscribe(() => {
      this.isAddLemmaVisible = false;
      this.entryForLemmaTemp = undefined;
      this.newLemmaTemp = undefined;
      this.loadNodes();
    });
  }

  onFetchChildren(event: { originalEvent: PointerEvent, node: TreeNode<any> }) {
    console.info('expand', event)
    this.loading = true;
    const dictionaryId = event.node.data?.id; 
    console.info(dictionaryId)
    if (!dictionaryId) return; //TODO aggiungere un messaggio di errore
    this.dictionaryService.retrieveComponents(dictionaryId).pipe(
      takeUntil(this.unsubscribe$),
      catchError((error: HttpErrorResponse) => {
        this.loading = false;
        return this.commonService.throwHttpErrorAndMessage(error, error.error.message);
      }),
    ).subscribe(children => {
      this.loading = false;
      const node = event.node;
      node.children = children.map(component => <TreeNode<any>>{
        data: component,
        type: DICTIONARY_NODE.lemma,
        leaf: true
      })
      console.info(children)
      this.lexicogEntries = [...this.lexicogEntries];
    });
  }

  onNewLemmaEmitValue(lemma: { lemma: string, pos: string, type: string[], isFromLexicon: boolean }) {
    this.newLemmaTemp = lemma;
  }

  /**Restore initial state of filters */
  onResetFilters() {
    this.searchTextForm.reset({
      search: ''
    });
    this.filtersForm.reset({
      caseSensitive: false,
      match: searchModeEnum.startsWith,
      language: '',
      editor: '',
      status: ''
    });
  }

  /**
   * Method that handles the display of the insertion dialog for a new lemma
   * @param entry {LexicogEntryListItem} dictionary entry to which associate the lemma
   */
  onShowNewLemmaDialog(entry: DictionaryListItem) {
    this.isAddLemmaVisible = true;
    this.entryForLemmaTemp = entry;
  }

  onSubmitEntry(entryData: { language: string, name: string, lemmas: { lemma: string, pos: string, type: string[], isFromLexicon: boolean }[], fullEntry: string, selectedCategory: string }) {
    this.dictionaryService.addDictionaryEntry(entryData.language, entryData.name).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe(newEntry => {
      switch(entryData.selectedCategory) {
        case 'referralEntry': {
          console.info('to be implemented'); //TODO implementare l'aggiunta di una relazione sameAs
          break;
        }
        case 'fullEntry': {
          if(entryData.lemmas.length>0) {
            this.onAddAssociateLemmas(newEntry, entryData.lemmas);
          }
          break;
        }
        default:
          console.error('Entry category not mapped');
          break;
      }
      this.loadNodes();
      console.info(newEntry);
    });
    this.isAddDictionaryEntryVisible = false;
  }

  private createFilters(isSearchInput: boolean) {
    if (isSearchInput) {
      this.lexicogRequest.text = this.searchTextForm.get('search')?.value || '';
    } else {
      const values = this.filtersForm.value;
      if (values.match) {
        this.lexicogRequest.searchMode = values.match;
      }
      this.lexicogRequest.author = values.editor || '';
      this.lexicogRequest.lang = values.language || '';
      this.lexicogRequest.status = values.status || '';
    }
    this.loadNodes();
  }

  private mapLexicogEntryToTreenode(lexicogEntry: DictionaryListItem): TreeNode<DictionaryListItem> {
    return <TreeNode<DictionaryListItem>>{
      data: lexicogEntry,
      type: DICTIONARY_NODE.entry,
      leaf: !lexicogEntry.hasChildren
    };
  }
}
