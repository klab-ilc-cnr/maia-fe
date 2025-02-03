import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, catchError, take, takeUntil } from 'rxjs';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

@Component({
  selector: 'app-dictionary-entry-referral-editor',
  templateUrl: './dictionary-entry-referral-editor.component.html',
  styleUrls: ['./dictionary-entry-referral-editor.component.scss']
})
export class DictionaryEntryReferralEditorComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  statusForm: string[] = ['working','completed', 'reviewed'];
  @Input() dictionaryEntry!: DictionaryEntry; //TODO set required true on Angular update
  referralEntryForm = new FormGroup({
    status: new FormControl<string>(''),
    label: new FormControl<string>('', [Validators.required, whitespacesValidator])
  });
  get status() { return this.referralEntryForm.controls.status }
  get label() { return this.referralEntryForm.controls.label }

  constructor(
    private dictionaryService: DictionaryService,
    private commonService: CommonService,
  ) {}

  ngOnInit(): void {
    this.status?.setValue(this.dictionaryEntry.status);
    this.label?.setValue(this.dictionaryEntry.label);
    
    this.status.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(value => {
      if(!value) return;
      this.dictionaryService.updateDictionaryEntryStatus(this.dictionaryEntry.id, value).pipe(
        take(1),
        catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
      ).subscribe(() => this.commonService.notifyOther({
        option: 'dictionary_entry_update', dictionaryId: this.dictionaryEntry.id, field: 'status', value: value
      }));
    });

    this.label.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(v => {
      if(this.label.invalid || !v) return; //avoid update if invalid
      this.dictionaryService.updateDictionaryEntryLabel(this.dictionaryEntry.id, v).pipe(
        take(1),
        catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
      ).subscribe(() => this.commonService.notifyOther({
        option: 'dictionary_entry_update', dictionaryId: this.dictionaryEntry.id, field: 'label', value: v
      }));
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }
}
