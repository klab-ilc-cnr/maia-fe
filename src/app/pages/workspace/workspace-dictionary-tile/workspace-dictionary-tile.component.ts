import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { Subject, debounceTime, distinctUntilChanged, map, takeUntil } from 'rxjs';
import { LexicogEntryListItem } from 'src/app/models/dictionary/lexicog-entry-list-item.model';
import { DictionaryStateService } from 'src/app/services/dictionary-state.service';

@Component({
  selector: 'app-workspace-dictionary-tile',
  templateUrl: './workspace-dictionary-tile.component.html',
  styleUrls: ['./workspace-dictionary-tile.component.scss']
})
export class WorkspaceDictionaryTileComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  /**Defines whether loading is in progress */
  loading = false;
  /**Number of vocabulary items retrieved */
  counter$ = this.dictionaryState.totalHits$;
  lexicogEntries$ = this.dictionaryState.lexicogEntries$.pipe(
    map(entries => entries?.map(entry => this.mapLexicogEntryToTreenode(entry))),
  ); //FIXME per qualche motivo non sembra recuperare i dati di mock, da verificare
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

  constructor(
    private dictionaryState: DictionaryStateService,
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
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
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
