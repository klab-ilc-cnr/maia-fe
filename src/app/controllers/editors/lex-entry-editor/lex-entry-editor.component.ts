import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Observable, Subscription, map, of, take } from 'rxjs';
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
    map(resp => resp.list.map(le => <{ label: string, value: string }>{
      label: le.label,
      value: le.lexicalEntry,
      external: false
    }))
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
      const seeAlsoCount = this.lexicalEntry.links.find(l => l.type === 'Reference')?.elements.find(r => r.label === 'seeAlso')?.count;
      if (seeAlsoCount && seeAlsoCount > 0) {
        this.getSeeAlso();
      }
    })
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onAddSeeAlso() {
    this.seeAlso.push(new FormControl({ label: '', value: '', external: false }));
  }

  onRemoveSeeAlso(index: number) {
    this.seeAlso.removeAt(index);
  }

  onSelectLexEntry(lexEntryId: string, formIndex: number) {
    this.seeAlso.at(formIndex).setValue(lexEntryId);
  }

  onSubmit() {
    console.info('form', this.form.value)
  }

  private getSeeAlso() {
    this.lexiconService.getLinguisticRelations('seeAlso', this.lexicalEntry.lexicalEntry).pipe(take(1)).subscribe(seeAlsoList => {
      seeAlsoList.forEach(seeAlso => {
        this.seeAlso.push(new FormControl({ label: seeAlso.label, value: seeAlso.entity, external: seeAlso.linkType === 'external' }))
      });
    })
  }
}
