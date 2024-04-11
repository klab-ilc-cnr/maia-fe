import { Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { GlobalStateService } from 'src/app/services/global-state.service';

@Component({
  selector: 'app-new-dictionary-entry',
  templateUrl: './new-dictionary-entry.component.html',
  styleUrls: ['./new-dictionary-entry.component.scss']
})
export class NewDictionaryEntryComponent implements OnInit {
  languages$ = this.globalState.languages$;

  entryForm = new FormGroup({
    language: new FormControl<string>('', [Validators.required]),
    name: new FormControl<string>('', [Validators.required]),
    lemmas: new FormArray([])
  });
  get lemmas() { return <FormArray>this.entryForm.get('lemmas') }

  constructor(
    private globalState: GlobalStateService,
  ) { }

  ngOnInit(): void {
  }

  onAddLemma(isDefault?: boolean) {
    const newLemma = { lemma: new FormControl<string>(''), pos: new FormControl<string>(''), type: new FormControl<string>('') };
    this.lemmas.push(new FormGroup(newLemma));
  }

  onRemoveLemma(index: number) {
    this.lemmas.removeAt(index);
  }
}
