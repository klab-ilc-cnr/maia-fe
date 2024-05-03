import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Subject, debounceTime, map, switchMap, takeUntil } from 'rxjs';
import { searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexoLanguage } from 'src/app/models/lexicon/lexical-entry.model';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

@Component({
  selector: 'app-new-dictionary-entry',
  templateUrl: './new-dictionary-entry.component.html',
  styleUrls: ['./new-dictionary-entry.component.scss']
})
export class NewDictionaryEntryComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  /**List of available languages */
  languages: LexoLanguage[] = [];
  currentFilter$ = new BehaviorSubject<string>('');
  suggestions = this.currentFilter$.pipe(
    debounceTime(300),
    switchMap(text => this.dictionaryEntries(text)),
  );
  dictionaryEntries = (text: string) => this.dictionaryService.retrieveLexicogEntryList({
    text: text,
    searchMode: searchModeEnum.startsWith,
    pos: '',
    author: '',
    lang: this.language?.value ?? '',
    status: '',
    offset: 0,
    limit: 500
  }).pipe(
    map(resp => resp.list),
  );

  /**Form to add new dictionary entries and lemmas (lexical entries) */
  entryForm = new FormGroup({
    language: new FormControl<string>('', [Validators.required]),
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    selectedCategory: new FormControl<string>('fullEntry'),
    fullEntry: new FormControl<string>(''),
    lemmas: new FormArray([])
  });
  get name() { return this.entryForm.controls.name }
  get language() { return this.entryForm.get('language') }
  /**Getter for the lemma's forms */
  get lemmas() { return <FormArray>this.entryForm.get('lemmas') }
  get selectedCategory() { return this.entryForm.get('selectedCategory') }
  /**Event that outputs the data of new items to be entered into the dictionary */
  @Output() submitEntry = new EventEmitter<any>();

  /**
   * Constructor for NewDictionaryEntryComponent
   * @param globalState {GlobalStateService}Service class for global lexicon status management
   */
  constructor(
    private globalState: GlobalStateService,
    private dictionaryService: DictionaryService,
  ) { }

  ngOnInit(): void {
    this.globalState.languages$.pipe( //FIXME probably to be changed
      takeUntil(this.unsubscribe$),
    ).subscribe(languages => {
      this.languages = languages;
      this.entryForm.get('language')?.setValue(languages[0].label);
    });

    this.selectedCategory?.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(category => {
      if (category) this.manageCategories(category);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
   * Add a new lemma row in the dynamic form
   * @param isDefault {boolean} defines whether the new lemma is the default one //TODO da implementare
   */
  onAddLemma(isDefault?: boolean) {
    const newLemma = { lemma: new FormControl<string>(''), pos: new FormControl<string>(''), type: new FormControl<string[]>([]), isFromLexicon: new FormControl<boolean>(false) };
    this.lemmas.push(new FormGroup(newLemma));
  }

  /**
   * Save variations in the value of a lemma 
   * @param lemma {{ lemma: string, pos: string, type: string[], isFromLexicon: boolean }} new lemma values
   * @param index {number} lemma position in the FormArray
   */
  onChangeLemmaValue(lemma: { lemma: string, pos: string, type: string[], isFromLexicon: boolean }, index: number) {
    this.lemmas.at(index).setValue(lemma);
  }

  onFilter(event: { originalEvent: { isTrusted: boolean }, query: string }) {
    this.currentFilter$.next(event.query);
  }

  /**Remove a lemma from the FormArray */
  onRemoveLemma(index: number) {
    this.lemmas.removeAt(index);
  }

  /**Emit the values for create a new dictionary entry with its lemmas (eventually) */
  onSubmitNewEntry() {
    this.submitEntry.emit(this.entryForm.value);
  }

  private manageCategories(category: string) {
    switch (category) {
      case 'fullEntry':
        this.entryForm.get('fullEntry')?.reset('');
        this.entryForm.get('fullEntry')?.removeValidators(Validators.required);
        break;
      case 'referralEntry': {
        const i = 0;
        while (i < this.lemmas.controls.length) {
          this.lemmas.removeAt(i);
        }
        this.entryForm.get('fullEntry')?.setValidators(Validators.required);
        break;
      }
      default:
        break;
    }
  }
}
