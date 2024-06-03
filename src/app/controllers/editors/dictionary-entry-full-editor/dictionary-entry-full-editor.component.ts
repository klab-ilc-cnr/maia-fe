import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, debounceTime, take, takeUntil } from 'rxjs';
import { DictionaryNoteVocabo } from 'src/app/models/custom-models/dictionary-note-vocabo';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';

@Component({
  selector: 'app-dictionary-entry-full-editor',
  templateUrl: './dictionary-entry-full-editor.component.html',
  styleUrls: ['./dictionary-entry-full-editor.component.scss', '../dictionary-entry-referral-editor/dictionary-entry-referral-editor.component.scss']
})
export class DictionaryEntryFullEditorComponent implements OnInit {
  private readonly unsubscribe$ = new Subject();
  statusForm: string[] = ['completed', 'reviewed', 'working'];
  @Input() dictionaryEntry!: DictionaryEntry; //TODO set required true on Angular update
  structuredNote!: DictionaryNoteVocabo;
  etymologyLanguages$ = this.dictionaryService.retrieveEtymologyLanguages();
  otherWorks$ = this.dictionaryService.retrieveOtherWorks();
  fullEntryForm = new FormGroup({
    status: new FormControl<string>(''),
    label: new FormControl<string>('', Validators.required),
    entryNote: new FormGroup({
      firstAttestation: new FormControl<string>(''),
      frequencies: new FormArray([]),
      etymology: new FormGroup({
        language: new FormControl<string>(''),
        etymon: new FormControl<string>(''),
        details: new FormControl<string>('')
      }),
      linguisticsSemantics: new FormControl<string>(''),
      decameron: new FormControl<string>(''),
      firstAbsAttestation: new FormControl<string>(''),
      boccaccioDante: new FormControl<string>(''),
      crusche: new FormControl<string>(''),
      polyrhematics: new FormControl<string>('')
    }),
    seeAlso: new FormArray([])
  });
  get status() { return this.fullEntryForm.controls.status }
  get label() { return this.fullEntryForm.controls.label }
  get entryNote() { return this.fullEntryForm.controls.entryNote }

  constructor(
    private dictionaryService: DictionaryService,
    private loggedUserService: LoggedUserService,
  ) {}

  ngOnInit(): void {
    this.structuredNote = new DictionaryNoteVocabo(this.dictionaryEntry.note);
    console.info(this.structuredNote)
    this.status?.setValue(this.dictionaryEntry.status);
    this.label?.setValue(this.dictionaryEntry.label);
    this.entryNote.setValue({
      firstAttestation: this.structuredNote.firstAbsAttestation,
      // frequencies: this.structuredNote.frequencies,
      frequencies: [],
      etymology: this.structuredNote.etimology,
      linguisticsSemantics: this.structuredNote.linguisticsSemantics,
      decameron: this.structuredNote.decameron,
      firstAbsAttestation: this.structuredNote.firstAbsAttestation,
      boccaccioDante: this.structuredNote.boccaccioDante,
      crusche: this.structuredNote.crusche,
      polyrhematics: this.structuredNote.polyrhematics
    });
    
    this.status.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(value => {
      console.info('salvo nuovo status', value)
      //TODO add update field
    });

    this.label.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(v => {
      console.info('salvo nuova label', v);
      //TODO add update field
    });

    this.entryNote.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(500),
    ).subscribe(v => {
      const username = this.loggedUserService.currentUser?.username ?? 'unknown user';
      this.dictionaryService.createAndUpdateDictionaryNote(this.dictionaryEntry.id, username, JSON.stringify(v)).pipe( //FIXME arriva un error 500 da BE
        take(1),
      ).subscribe(res => console.info(res));
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
