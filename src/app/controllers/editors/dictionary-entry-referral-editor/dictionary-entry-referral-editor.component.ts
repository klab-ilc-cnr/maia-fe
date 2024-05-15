import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';

@Component({
  selector: 'app-dictionary-entry-referral-editor',
  templateUrl: './dictionary-entry-referral-editor.component.html',
  styleUrls: ['./dictionary-entry-referral-editor.component.scss']
})
export class DictionaryEntryReferralEditorComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  statusForm: string[] = ['completed', 'reviewed', 'working'];
  @Input() dictionaryEntry!: DictionaryEntry; //TODO set required true on Angular update
  referralEntryForm = new FormGroup({
    status: new FormControl<string>(''),
    label: new FormControl<string>('', Validators.required)
  });
  get status() { return this.referralEntryForm.controls.status }
  get label() { return this.referralEntryForm.controls.label }

  ngOnInit(): void {
    this.status?.setValue(this.dictionaryEntry.status);
    this.label?.setValue(this.dictionaryEntry.label);
    
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
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
