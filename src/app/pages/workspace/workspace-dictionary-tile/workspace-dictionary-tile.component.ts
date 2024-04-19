import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { Subject, catchError, debounceTime, distinctUntilChanged, take, takeUntil } from 'rxjs';
import { LexicogEntriesRequest } from 'src/app/models/dictionary/lexicog-entries-request.model';
import { LexicogEntryListItem } from 'src/app/models/dictionary/lexicog-entry-list-item.model';
import { searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';

@Component({
  selector: 'app-workspace-dictionary-tile',
  templateUrl: './workspace-dictionary-tile.component.html',
  styleUrls: ['./workspace-dictionary-tile.component.scss'],
})
export class WorkspaceDictionaryTileComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  rows = 500;
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
    match: new FormControl<string>('startsWith'),
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
      this.createFilters();
    });
    this.filtersForm.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(() => {
      this.createFilters();
    });

    this.loadNodes(null);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  loadNodes(event: any) {
    if (event) { //not on first load
      this.lexicogRequest.offset = event.first;
      this.lexicogRequest.limit = event.first + event.rows;
    }
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

  onResetFilters() {
    this.searchTextForm.reset({
      search: ''
    });
    this.filtersForm.reset({
      caseSensitive: false,
      match: 'startsWith',
      language: '',
      editor: '',
      status: ''
    });
  }

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
      this.loadNodes(null); //FIXME To be optimized with dynamic insertion of the new entry into the list, without full update
      console.info(newEntry);
      const lemmas = entryData.lemmas;
      if(lemmas.length <= 0) return;
      const addAndAssociate: {lemma: string, pos: string, type: string[], isFromLexicon: boolean}[] = [];
      const associate: {lemma: string, pos: string, type: string[], isFromLexicon: boolean}[] = [];
      lemmas.forEach(lemma => {
        if(lemma.isFromLexicon) {
          associate.push(lemma); //TODO rifletti se meglio una lista di lemmi o di chiamate
        } else {
          addAndAssociate.push(lemma);
        }
      });
      console.group('Lemmi da lavorare');
      console.info('add & associate', addAndAssociate);
      console.info('associate', associate);
      console.groupEnd();
      //TODO add creation and association of lemmas
    });
    this.isAddDictionaryEntryVisible = false;
  }

  private createFilters() {
    //TODO develop filters management
    console.info('CREAZIONE DEL FILTRO ALLA LISTA');
  }

  private mapLexicogEntryToTreenode(lexicogEntry: LexicogEntryListItem): TreeNode<LexicogEntryListItem> {
    return <TreeNode<LexicogEntryListItem>>{
      data: lexicogEntry,
      children: lexicogEntry.hasChildren ? [] : null
    };
  }
}
