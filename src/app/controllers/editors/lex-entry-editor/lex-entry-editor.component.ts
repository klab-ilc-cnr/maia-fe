import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Observable, Subscription, map, of } from 'rxjs';
import { searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntryCore, LexicalEntryListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-lex-entry-editor',
  templateUrl: './lex-entry-editor.component.html',
  styleUrls: ['./lex-entry-editor.component.scss']
})
export class LexEntryEditorComponent implements OnInit, OnDestroy {
  emptyField = '-- Select --'
  subs!: Subscription;
  @Input() lexicalEntry$!: Observable<LexicalEntryCore>;
  lexicalEntry!: LexicalEntryCore;
  initialType!: string;
  form = new FormGroup({
    status: new FormControl<string>({ value: '', disabled: true }), //TODO sostituire disabled true con controllo sui ruoli utente
    label: new FormControl<string>(''),
    language: new FormControl<string>(''),
    pos: new FormControl<string>(''),
    type: new FormControl<string[]>([]),
    seeAlso: new FormArray<FormControl>([])
  });

  /**Lista delle option dello status */
  statusForm: string[] = ['completed', 'reviewed', 'working'];
  languages$ = this.globalState.languages$;
  pos$ = this.globalState.pos$;
  types$ = this.globalState.lexicalEntryTypes$;

  get seeAlso() {
    return this.form.controls['seeAlso'] as FormArray;
  }

  lexConceptList = (text: string) => this.lexiconService.getFilteredLexicalConcepts({
    text: text,
    searchMode: searchModeEnum.startsWith,
    labelType: "prefLabel",
    author: "",
    offset: 0,
    limit: 500
  }).pipe(
    map(resp => resp.list)
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

  constructor(
    private globalState: GlobalStateService,
    private lexiconService: LexiconService,
  ) {
  }

  ngOnInit(): void {
    this.subs = this.lexicalEntry$.subscribe(le => {
      this.lexicalEntry = le;
      const lexEntryPosCode = this.lexicalEntry.morphology.find(m => m.trait.endsWith('#partOfSpeech'))?.value;
      const lexEntryTypeCode: string[] = [];
      this.lexicalEntry.type.forEach(type => {
        lexEntryTypeCode.push('http://www.w3.org/ns/lemon/ontolex#' + type); //TODO capire come gestire in maniera generalizzata @andreabellandi
      });
      if (le.status) this.form.get('status')?.setValue(le.status);
      if (le.label) this.form.get('label')?.setValue(le.label);
      if (le.language) this.form.get('language')?.setValue(le.language);
      if (lexEntryPosCode) this.form.get('pos')?.setValue(lexEntryPosCode);
      if (lexEntryTypeCode && lexEntryTypeCode.length > 0) this.form.get('type')?.setValue(lexEntryTypeCode);
    })
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onAddSeeAlso() {
    this.seeAlso.push(new FormControl(''));
  }

  onRemoveSeeAlso(index: number) {
    this.seeAlso.removeAt(index);
  }

  onSelectLexEntry(lexEntry: LexicalEntryListItem) {
    console.info('add see also', lexEntry.lexicalEntry);
  }

  onSubmit() {
    console.info('form', this.form.value)
  }

}
