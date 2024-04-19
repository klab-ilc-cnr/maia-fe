import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { Subject, catchError, debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs';
import { LexicogEntriesRequest } from 'src/app/models/dictionary/lexicog-entries-request.model';
import { LexicogEntryListItem } from 'src/app/models/dictionary/lexicog-entry-list-item.model';
import { STATUSES, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { GlobalStateService } from 'src/app/services/global-state.service';

@Component({
  selector: 'app-workspace-dictionary-tile',
  templateUrl: './workspace-dictionary-tile.component.html',
  styleUrls: ['./workspace-dictionary-tile.component.scss'],
})
export class WorkspaceDictionaryTileComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  rows = 5000;
  statuses = Object.values(STATUSES);
  /**List of available languages */
  languages$ = this.globalState.languages$; //FIXME probably to be changed
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
  lexicogEntries: TreeNode<LexicogEntryListItem>[] = [];
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

  isVisibleCheckbox = false;
  isAddDictionaryEntryVisible = false;
  isAddLemmaVisible = false;
  newLemmaTemp?: { lemma: string, pos: string, type: string[], isFromLexicon: boolean };
  entryForLemmaTemp?: LexicogEntryListItem;

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

    ]

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

  onAddAssociateLemmas(lemmas: {lemma: string, pos: string, type: string[], isFromLexicon: boolean}[]) {
    const requests = [];
    lemmas.forEach((lemma, i) => {
      console.info('insert {lemma} at {i}');
      //TODO per ogni lemma creo una richiesta http
    });
    //TODO passo la lista di richieste 
  }

  onAddNewLemma() {
    console.group('Data to add lemma')
    console.info('dictionary entry', this.entryForLemmaTemp)
    console.info('new lemma', this.newLemmaTemp)
    console.groupEnd()
    this.isAddLemmaVisible = false;
    this.entryForLemmaTemp = undefined;
    this.newLemmaTemp = undefined;
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
  onShowNewLemmaDialog(entry: LexicogEntryListItem) {
    this.isAddLemmaVisible = true;
    this.entryForLemmaTemp = entry;
  }

  onSubmitEntry(entryData: {language: string, name: string, lemmas: {lemma: string, pos: string, type: string[], isFromLexicon: boolean}[]}) {
    console.info(entryData);
    this.dictionaryService.addDictionaryEntry(entryData.language, entryData.name).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe(newEntry => {
      this.onAddAssociateLemmas(entryData.lemmas);
      this.loadNodes(); //FIXME To be optimized with dynamic insertion of the new entry into the list, without full update
      console.info(newEntry);
    });
    this.isAddDictionaryEntryVisible = false;
  }

  private createFilters(isSearchInput: boolean) {
    if(isSearchInput) {
      this.lexicogRequest.text = this.searchTextForm.get('search')?.value || '';
    } else {
    const values = this.filtersForm.value;
    if(values.match) {
      this.lexicogRequest.searchMode = values.match;
    }
    this.lexicogRequest.author = values.editor || '';
    this.lexicogRequest.lang = values.language || '';
    this.lexicogRequest.status = values.status || '';
  }
    this.loadNodes();
  }

  private mapLexicogEntryToTreenode(lexicogEntry: LexicogEntryListItem): TreeNode<LexicogEntryListItem> {
    return <TreeNode<LexicogEntryListItem>>{
      data: lexicogEntry,
      children: lexicogEntry.hasChildren ? [] : null
    };
  }
}
