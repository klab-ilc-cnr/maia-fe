import { Component, Input, OnInit } from '@angular/core';
import { FieldControlService } from 'src/app/services/field-control.service';
import { FieldBase } from '../field-base';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-dynamic-form',
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],
  providers: [ FieldControlService ]
})
export class DynamicFormComponent implements OnInit {
  @Input() fields: FieldBase<string | string[] | {value: string, checkbox: boolean}>[] | null = [];
  form!: FormGroup;
  payload = '';

  constructor(
    private fieldControlService: FieldControlService
  ) { }

  ngOnInit(): void {
    this.form = this.fieldControlService.toFormGroup(this.fields as FieldBase<string | string[] | {value: string, checkbox: boolean}>[]);
  }

  onSubmit() {
    this.payload = JSON.stringify(this.form.getRawValue());
  }
}
