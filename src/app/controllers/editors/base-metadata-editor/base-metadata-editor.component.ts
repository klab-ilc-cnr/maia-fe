import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Form, FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject, catchError, debounceTime, skip, take, takeUntil, throwError } from 'rxjs';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { UserService } from 'src/app/services/user.service';
import { MessageService } from 'primeng/api';
import { User } from 'src/app/models/user';

@Component({
  selector: 'app-base-metadata-editor',
  templateUrl: './base-metadata-editor.component.html',
  styleUrls: ['./base-metadata-editor.component.scss']
})
export class BaseMetadataEditorComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  @Input() entry$!: Observable<any>;
  @Input() confidenceLabel = 'Confidence';

  formControls : {[name: string] : FormControl} = {
    creator: new FormControl<string>({ value: '', disabled: true }),
    creationDate: new FormControl<string>({ value: '', disabled: true }),
    provenance: new FormControl<string>(''),
    confidence: new FormControl<number | undefined>(undefined),
    note: new FormControl<string>(''),
  };

  form! : FormGroup;
  entry!: any;
  currentUser!: User;
  relations!: any;

  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) {
    this.userService.retrieveCurrentUser().pipe(
      take(1),
    ).subscribe(cu => {
      this.currentUser = cu;
    });
  }

  private subscribe(fieldName: string) {
    const control = this.form.controls[fieldName];
    control.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(500),
      skip(1),
    ).subscribe(value => {

      if (!this.currentUser.name) {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Current user not found`));
        return;
      }

      const fieldType = this.relations[fieldName.toUpperCase() as keyof typeof this.relations];
      value = this.validate(fieldType, fieldName, value);

      if (value != undefined) {
        this.onUpdateField(this.currentUser.name, fieldType, value).then((obs: Observable<string>) => {
          this.manageUpdateObservable(obs, fieldType, fieldName, value);
        });
      }
    });
  }

  ngOnInit(): void {
    if (!this.relations) throw new Error('this.relations must be set in BaseMetatadaEditorComponent');

    this.form = new FormGroup(this.formControls);
    this.subscribe('note');
    this.subscribe('confidence');

    this.entry$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((entry) => this.onLoadData(entry));
  }

  protected onLoadData(entry: typeof this.entry) {
    this.entry = entry;
    const formControlList = this.form.controls;
    formControlList['creator'].setValue(entry.creator);
    if (entry.creationDate !== '') {
      const date = new Date(entry.creationDate).toLocaleString();
      formControlList['creationDate'].setValue(date);
    }
    if (+entry.confidence !== -1) {
      formControlList['confidence'].setValue(+entry.confidence * 100);
    }
    formControlList['note'].setValue(entry.note?? '');
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  private manageUpdateObservable(updateObs: Observable<string>, relation: string, fieldName: string, value: any) {
    updateObs.pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        const msg = this.msgConfService.generateWarningMessageConfig(`Update "${relation}" failed `);
        this.messageService.add(msg);
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(resp => {
      this.entry = { ...this.entry, [fieldName]: value, lastUpdate: resp};
      const msg = this.msgConfService.generateSuccessMessageConfig(`Update "${relation}" success `);
      this.messageService.add(msg);
    });
  }

  protected validate(fieldType: any, fieldName: string, value: any) {
    if (value === this.entry[fieldName as keyof typeof this.entry]) return;

    if (fieldType === this.relations.CONFIDENCE) {
      value /= 100;
    } else if (fieldType === this.relations.NOTE) {
      value = value?? '';
    }

    return value;
  }

  protected async onUpdateField(userName: string, relation: any, value: any): Promise<Observable<string>> {
    const obs = throwError(() => new Error("BaseMetadataEditor is an abstract component and cannot be directly used"));
    return new Promise<Observable<string>>(() => obs);
  }
}
