import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { encode } from 'html-entities';
import { Subject, catchError, debounceTime, map, take, takeUntil } from 'rxjs';
import { DictionaryNoteVocabo } from 'src/app/models/custom-models/dictionary-note-vocabo';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LinguisticRelationModel } from 'src/app/models/lexicon/linguistic-relation.model';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

@Component({
  selector: 'app-dictionary-entry-full-editor',
  templateUrl: './dictionary-entry-full-editor.component.html',
  styleUrls: ['./dictionary-entry-full-editor.component.scss', '../dictionary-entry-referral-editor/dictionary-entry-referral-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DictionaryEntryFullEditorComponent implements OnInit {
  /**To manage subscription */
  private readonly unsubscribe$ = new Subject();
  /**List of available statuses */
  statusForm: string[] = ['completed', 'reviewed', 'working'];
  /**Dictionary entry of which we show the details */
  @Input() dictionaryEntry!: DictionaryEntry; //TODO set required true on Angular update
  /**Object that makes explicit the non-standard fields stored in the note */
  structuredNote!: DictionaryNoteVocabo;
  /**List of see also relations of a dictionary entry */
  dictionarySeeAlso: LinguisticRelationModel[] = []
  /**List of source languages available for etymology */
  etymologyLanguages$ = this.dictionaryService.retrieveEtymologyLanguages();
  /**List of other works */
  otherWorks$ = this.dictionaryService.retrieveOtherWorks();
  /**List of works by an author */
  authorWorks$ = this.dictionaryService.retrieveAuthorDocuments();
  /**Filter function for dictionary entries in the autocomplete of see also */
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
    label: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    entryNote: new FormGroup({
      firstAttestation: new FormControl<string>(''),
      firstAttestationDetails: new FormControl<string>(''),
      decameronOccurrences: new FormControl<number>(0),
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
  get decameronOccurrences() { return this.entryNote.controls['decameronOccurrences'] }
  get otherOccurrences() { 
    let temp = 0;
    this.frequencies.controls.forEach(f => {
      temp = temp + f.value.frequency;
    });
    return temp;
   }

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
    this.status?.setValue(this.dictionaryEntry.status);
    this.label?.setValue(this.dictionaryEntry.label);
    this.entryNote.setValue({
      firstAttestation: this.structuredNote.firstAttestation,
      firstAttestationDetails: this.structuredNote.firstAttestationDetails,
      decameronOccurrences: this.structuredNote.decameronOccurrences,
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
      debounceTime(500),
    ).subscribe(v => {
      if(this.label.invalid || !v) return; //avoid update if invalid
      this.dictionaryService.updateDictionaryEntryLabel(this.dictionaryEntry.id, v).pipe(
        take(1),
        catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
      ).subscribe(() => this.manageUpdateEmission('label', v));
    });

    this.entryNote.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(500),
    ).subscribe(v => {
      const username = this.loggedUserService.currentUser?.username ?? 'unknown user';
      const encodedValue = {
        ...v,
        etymology: {
          ...v.etymology,
          details: encode(v.etymology?.details)
        },
        linguisticsSemantics: encode(v.linguisticsSemantics),
        decameron: encode(v.decameron),
        firstAbsAttestation: encode(v.firstAbsAttestation),
        boccaccioDante: encode(v.boccaccioDante),
        crusche: encode(v.crusche),
        polyrhematics: encode(v.polyrhematics)
      }
      this.dictionaryService.createAndUpdateDictionaryNote(this.dictionaryEntry.id, username, JSON.stringify(encodedValue)).pipe(
        take(1),
      ).subscribe(res => console.info(res));
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**Method that adds a new line for the ocurrence description of the item */
  onAddFrequency() {
    const newFrequency = { documentId: '', frequency: 0 };
    this.frequencies.push(new FormControl(newFrequency));
  }

  /**Method that adds a new line for the description of the see also relationship of the dictionary entry */
  onAddSeeAlso() {
    const newSeeAlso = { label: '', value: '', external: false, inferred: false };
    this.seeAlso.push(new FormControl(newSeeAlso));
  }

  /**
   * Method that removes a row from the frequency list
   * @param index {number} position in the list
   */
  onRemoveFrequencyAt(index: number) {
    this.frequencies.removeAt(index);
  }

  /**
   * Method that eliminates a see also type relationship
   * @param index {number} position in the FormArray
   */
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

  /**
   * Method that handles saving a new relationship of type see also
   * @param selectedValue {{ label: string, value: string, external: boolean, inferred: boolean }}
   * @param formIndex {number} position 
   */
  onSelectDictEntry(selectedValue: { label: string, value: string, external: boolean, inferred: boolean }, formIndex: number) {
    this.dictionaryService.associateSeeAlsoToDictEntry(this.dictionaryEntry.id, selectedValue.value).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error,error.error.message)),
    ).subscribe(resp => { console.info(resp) });
  }

  /**
   * Method that handles the valorization of an element in the frequency array form
   * @param frequencyValue {{ documentId: string, frequency: number }}
   * @param index {number} position in the FormArray
   */
  onUpdateFrequency(frequencyValue: { documentId: string, frequency: number }, index: number) {
    this.frequencies.at(index).setValue(frequencyValue)
  }

  /**
   * Initialize frequencies with data already saved
   * @param frequencies {{ documentId: string, frequency: number }[]}
   */
  private initFrequencies(frequencies: { documentId: string, frequency: number }[]) {
    for(const freq of frequencies) {
      this.frequencies.push(new FormControl(freq));
    }
  }

  /**
   * Initialize see also relationships with data already saved
   * @param seeAlsoList {LinguisticRelationModel[]}
   */
  private initSeeAlso(seeAlsoList: LinguisticRelationModel[]) {
    seeAlsoList.forEach(seeAlso => {
      this.seeAlso.push(new FormControl({ label: seeAlso.label, value: seeAlso.entity, external: false, inferred: seeAlso.inferred }))
    });
  }

  /**
   * Manages the emission of an update dictionary field notify
   * @param updatedField {string} name of the field to be updated
   * @param newValue {string} new value of the field
   */
  private manageUpdateEmission(updatedField: string, newValue: string) {
    this.commonService.notifyOther({
      option: 'dictionary_entry_update', dictionaryId: this.dictionaryEntry.id, field: updatedField, value: newValue
    });
  }
}
