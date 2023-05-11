import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { LexicalEntryCore } from 'src/app/models/lexicon/lexical-entry.model';
import { GlobalStateService } from 'src/app/services/global-state.service';

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
    type: new FormControl<string[]>([])
  });
  /**Lista delle option dello status */
  statusForm: string[] = ['completed', 'reviewed', 'working'];
  languages$ = this.globalState.languages$;
  pos$ = this.globalState.pos$;
  types$ = this.globalState.lexicalEntryTypes$;

  constructor(
    private globalState: GlobalStateService,
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

  onSubmit() {
    console.info('form', this.form.value)
  }

}
