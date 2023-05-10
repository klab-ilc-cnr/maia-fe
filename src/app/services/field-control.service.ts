import { Injectable } from '@angular/core';
import { FieldBase } from '../forms/field-base';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Injectable()
export class FieldControlService {

  toFormGroup(fields: FieldBase<string | string[] | {value: string, checkbox: boolean}>[]) {
    const group: any = {};

    fields.forEach(field => {
      group[field.key] = field.required ? new FormControl(field.value || '', Validators.required)
        : new FormControl(field.value || '');
    });
    return new FormGroup(group);
  }
}
