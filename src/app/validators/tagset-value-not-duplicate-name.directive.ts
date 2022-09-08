import { Directive, Input } from '@angular/core';
import { TagsetValue } from '../models/tagset/tagset-value';
import { AbstractControl, NG_VALIDATORS, ValidatorFn } from '@angular/forms';

const VALIDATOR_ERROR = { 'tagsetValueNotDuplicateName': true };

export function TagsetValueNameDuplicateValidator(options: TagsetValue[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
      if ((!options)) {
        return null;
      }

      let values = options.filter((item: any) => item.originalName != control.get('tvOriginalName')?.value);

      let v = values?.find((item: any) => item.name == control.get('tvName')?.value);

      if (!v) { return null; }

      return VALIDATOR_ERROR;
  };
}

@Directive({
  selector: '[appTagsetValueNotDuplicateName]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: TagsetValueNotDuplicateNameDirective, multi: true }
  ]
})
export class TagsetValueNotDuplicateNameDirective {
  @Input('appTagsetValueNotDuplicateName')
  options: TagsetValue[] = [];

  validate(control: AbstractControl): { [key: string]: any } | null {
    return this.options ? TagsetValueNameDuplicateValidator(this.options)(control)
        : null;
  }
}
