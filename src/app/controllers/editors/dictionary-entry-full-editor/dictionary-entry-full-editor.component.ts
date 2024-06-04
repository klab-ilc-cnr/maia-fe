import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, catchError, debounceTime, map, take, takeUntil } from 'rxjs';
import { DictionaryNoteVocabo } from 'src/app/models/custom-models/dictionary-note-vocabo';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LinguisticRelationModel } from 'src/app/models/lexicon/linguistic-relation.model';
import { CommonService } from 'src/app/services/common.service';
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
  dictionarySeeAlso: LinguisticRelationModel[] = []
  etymologyLanguages$ = this.dictionaryService.retrieveEtymologyLanguages();
  otherWorks$ = this.dictionaryService.retrieveOtherWorks();
  dictEntryList = (text: string) => this.dictionaryService.retrieveLexicogEntryList({
    text: text,
    searchMode: searchModeEnum.startsWith,
    pos: '',
    author: '',
    lang: '',
    status: '',
    offset: 0,
    limit: 5000
  }).pipe(
    takeUntil(this.unsubscribe$),
    map(resp => resp.list.map(de => <{ label: string, value: string, external: boolean, inferred: boolean }>{
      label: de.label,
      value: de.id,
      external: false,
      inferred: false
    })),
  );
  fullEntryForm = new FormGroup({
    status: new FormControl<string>(''),
    label: new FormControl<string>('', Validators.required),
    entryNote: new FormGroup({
      firstAttestation: new FormControl<string>(''),
      frequencies: new FormArray<FormControl>([]),
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
    seeAlso: new FormArray<FormControl>([])
  });
  get status() { return this.fullEntryForm.controls.status }
  get label() { return this.fullEntryForm.controls.label }
  get entryNote() { return this.fullEntryForm.controls.entryNote }
  get frequencies() { return this.entryNote.controls['frequencies'] as FormArray }
  get seeAlso() { return this.fullEntryForm.controls['seeAlso'] as FormArray; }

  constructor(
    private dictionaryService: DictionaryService,
    private loggedUserService: LoggedUserService,
    private commonService: CommonService,
  ) {
  }

  ngOnInit(): void {
    this.dictionaryService.retrieveDictionarySeeAlso(this.dictionaryEntry.id).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error,error.error.message)),
    ).subscribe(resp => {
      this.dictionarySeeAlso = resp;
      this.initSeeAlso(this.dictionarySeeAlso);
    });
    this.structuredNote = new DictionaryNoteVocabo(this.dictionaryEntry.note);
    console.info(this.structuredNote)
    this.status?.setValue(this.dictionaryEntry.status);
    this.label?.setValue(this.dictionaryEntry.label);
    this.entryNote.setValue({
      firstAttestation: this.structuredNote.firstAttestation,
      frequencies: [],
      etymology: this.structuredNote.etymology,
      linguisticsSemantics: this.structuredNote.linguisticsSemantics,
      decameron: this.structuredNote.decameron,
      firstAbsAttestation: this.structuredNote.firstAbsAttestation,
      boccaccioDante: this.structuredNote.boccaccioDante,
      crusche: this.structuredNote.crusche,
      polyrhematics: this.structuredNote.polyrhematics
    });
    this.initFrequencies(this.structuredNote.frequencies);
    
    this.status.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(value => {
      console.info('salvo nuovo status', value)
      //TODO add update field
    });

    this.label.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(v => {
      if(!v) {
        console.error('Missing label');
        return;
      }
      // this.dictionaryService.updateDictionaryEntryLabel(this.dictionaryEntry.id, v).pipe( //TODO remove comment when service is ready
      //   take(1),
      //   catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error,error.error.message)),
      // ).subscribe(r => console.info(r));
      console.info('salvo nuova label', v);
    });

    this.entryNote.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(500),
    ).subscribe(v => {
      const username = this.loggedUserService.currentUser?.username ?? 'unknown user';
      this.dictionaryService.createAndUpdateDictionaryNote(this.dictionaryEntry.id, username, JSON.stringify(v)).pipe(
        take(1),
      ).subscribe(res => console.info(res));
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  onAddFrequency() {
    const newFrequency = { documentId: '', frequency: 0 };
    this.frequencies.push(new FormControl(newFrequency));
  }

  onAddSeeAlso() {
    const newSeeAlso = { label: '', value: '', external: false, inferred: false };
    this.seeAlso.push(new FormControl(newSeeAlso));
  }

  onRemoveFrequencyAt(index: number) {
    this.frequencies.removeAt(index);
  }

  onRemoveSeeAlso(index: number) {
    const currentValue = this.seeAlso.at(index).value['value'];
    if(currentValue !== '') {
      this.dictionaryService.dissociateSeeAlsoFromDictEntry(this.dictionaryEntry.id, currentValue).pipe(
        take(1),
        catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error,error.error.message)),
      ).subscribe(resp => console.info(resp));
    }
    this.seeAlso.removeAt(index);
  }

  onSelectDictEntry(selectedValue: { label: string, value: string, external: boolean, inferred: boolean }, formIndex: number) {
    this.dictionaryService.associateSeeAlsoToDictEntry(this.dictionaryEntry.id, selectedValue.value).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error,error.error.message)),
    ).subscribe(resp => { console.info(resp) });
  }

  onUpdateFrequency(frequencyValue: { documentId: string, frequency: number }, index: number) {
    this.frequencies.at(index).setValue(frequencyValue)
  }

  private initFrequencies(frequencies: { documentId: string, frequency: number }[]) {
    for(const freq of frequencies) {
      this.frequencies.push(new FormControl(freq));
    }
  }

  private initSeeAlso(seeAlsoList: LinguisticRelationModel[]) {
    seeAlsoList.forEach(seeAlso => {
      this.seeAlso.push(new FormControl({ label: seeAlso.label, value: seeAlso.entity, external: false, inferred: seeAlso.inferred }))
    });
  }
}
