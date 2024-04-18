import { Component, EventEmitter, Output } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { GlobalStateService } from 'src/app/services/global-state.service';

@Component({
  selector: 'app-new-dictionary-entry',
  templateUrl: './new-dictionary-entry.component.html',
  styleUrls: ['./new-dictionary-entry.component.scss']
})
export class NewDictionaryEntryComponent {
  /**List of available languages */
  languages$ = this.globalState.languages$; //FIXME probably to be changed
  /**Form to add new dictionary entries and lemmas (lexical entries) */
  entryForm = new FormGroup({
    language: new FormControl<string>('', [Validators.required]),
    name: new FormControl<string>('', [Validators.required]),
    lemmas: new FormArray([])
  });
  /**Getter for the lemma's forms */
  get lemmas() { return <FormArray>this.entryForm.get('lemmas') }
  /**Event that outputs the data of new items to be entered into the dictionary */
  @Output() submitEntry = new EventEmitter<any>();

  /**
   * Constructor for NewDictionaryEntryComponent
   * @param globalState {GlobalStateService}Service class for global lexicon status management
   */
  constructor(
    private globalState: GlobalStateService,
  ) { }

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

  /**Remove a lemma from the FormArray */
  onRemoveLemma(index: number) {
    this.lemmas.removeAt(index);
  }

  /**Emit the values for create a new dictionary entry with its lemmas (eventually) */
  onSubmitNewEntry() {
    this.submitEntry.emit(this.entryForm.value);
  }
}
