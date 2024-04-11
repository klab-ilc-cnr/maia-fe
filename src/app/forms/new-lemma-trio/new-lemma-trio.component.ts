import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, Subject, debounceTime, distinctUntilChanged, map, switchMap, takeUntil } from 'rxjs';
import { searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntryListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-new-lemma-trio',
  templateUrl: './new-lemma-trio.component.html',
  styleUrls: ['./new-lemma-trio.component.scss']
})
export class NewLemmaTrioComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  @Input() index?: number;
  @Output() remove = new EventEmitter<number>();
  @Output() changeValue = new EventEmitter<{
    lemma: string,
    pos: string,
    type: string[],
    isFromLexicon: boolean
  }>();
  pos$ = this.globalState.pos$;
  lexicalEntryTypes$ = this.globalState.lexicalEntryTypes$;

  currentFilter$ = new BehaviorSubject<string>('');
  suggestions = this.currentFilter$.pipe(
    debounceTime(300),
    switchMap(text => this.lexEntryList(text)),
  );
  lexEntryList = (text: string) => this.lexiconService.getLexicalEntriesList({
    text: text,
    searchMode: searchModeEnum.startsWith,
    type: '',
    pos: '',
    formType: '',
    author: '',
    lang: '',
    status: '',
    offset: 0,
    limit: 500
  }).pipe(
    map(resp => resp.list)
  );

  lemmaForm = new FormGroup({
    lemma: new FormControl(),
    pos: new FormControl(),
    type: new FormControl()
  });
  get lemma() { return this.lemmaForm.get('lemma') as FormControl }

  constructor(
    private globalState: GlobalStateService,
    private lexiconService: LexiconService,
  ) { }

  ngOnInit(): void {
    this.lemma.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      distinctUntilChanged(),
      debounceTime(300),
    ).subscribe(lemma => {
      if (typeof (lemma) !== 'string') {
        this.setAndDisablePos(lemma);
        this.setAndDisableType(lemma);
      } else {
        this.lemmaForm.get('pos')?.enable();
        this.lemmaForm.get('type')?.enable();
      }
    });

    this.lemmaForm.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(value => {
      console.info(value)
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  onFilter(event: { originalEvent: { isTrusted: boolean }, query: string }) {
    this.currentFilter$.next(event.query);
  }

  onRemoveNewLemmaTrio() {
    this.remove.emit(this.index);
  }

  onSelection(event: any) {
    console.info('lemma autocomplete value', event)
  }

  private setAndDisablePos(lexicalEntry: LexicalEntryListItem) {
    const posControl = this.lemmaForm.get('pos');
    const posCode = lexicalEntry.morphology.find(m => m.trait.endsWith('#partOfSpeech'))?.value;
    if (posCode) {
      posControl?.setValue(posCode);
    }
    posControl?.disable();
  }

  private setAndDisableType(lexicalEntry: LexicalEntryListItem) {
    const typeControl = this.lemmaForm.get('type');
    lexicalEntry.type.forEach(t => {
      typeControl?.setValue(t); //FIXME qualcosa non torna con la valorizzazione
    })
    // typeControl?.setValue(lexicalEntry.type[0]);
    typeControl?.disable();
  }
}
