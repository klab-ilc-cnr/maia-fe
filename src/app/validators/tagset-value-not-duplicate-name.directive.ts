import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidatorFn } from '@angular/forms';
import { TagsetValue } from '../models/tagset/tagset-value';

/**Duplication error of a tagset value name */
const VALIDATOR_ERROR = { 'tagsetValueNotDuplicateName': true };

/**
 * Function that evaluates whether the value name of a tagset is a duplicate
 * @param options {TagsetValue[]} list of tagset values
 * @returns {ValidatorFn} returns any duplication errors
 */
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

/**Directive to validate the name of a tagset value so that it is not a duplicate */
@Directive({
  selector: '[appTagsetValueNotDuplicateName]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: TagsetValueNotDuplicateNameDirective, multi: true }
  ]
})
export class TagsetValueNotDuplicateNameDirective {
  /**List of values of a tagset on which to perform control */
  @Input('appTagsetValueNotDuplicateName')
  options: TagsetValue[] = [];

  /**
   * Validator interface method that checks whether the name of a tagset value constitutes a duplicate
   * @param control {AbstractControl} control to validate
   * @returns {{ [key: string]: any } | null} any duplication error
   */
  validate(control: AbstractControl): { [key: string]: any } | null {
    return this.options ? TagsetValueNameDuplicateValidator(this.options)(control)
        : null;
  }
}
