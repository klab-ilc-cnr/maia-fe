import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidatorFn } from '@angular/forms';

/**Validation error on duplicate names */
const VALIDATOR_ERROR = { 'notDuplicateName': true };

/**
 * Function that evaluates whether the value of an input field is already in a list of strings
 * @param options {string[]} names on which to evaluate duplication
 * @returns {ValidatorFn} returns a possible duplication validation error
 */
export function nameDuplicateValidator(options: string[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
      if ((!options)) {
        return null;
      }

      let elem = options.find((item: any) => item == control.value);

      if (!elem) { return null; }

      return VALIDATOR_ERROR;
  };
}

/**Validation directive, defines whether an input value is already in a list of strings */
@Directive({
  selector: '[appNotDuplicateName]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: NotDuplicateNameDirective, multi: true }
  ]
})
export class NotDuplicateNameDirective {
  /**List of strings on which to perform validation */
  @Input('appNotDuplicateName')
  options: string[] = [];

  /**
   * Validator interface method that checks whether the value of an input field is already in a list of strings
   * @param control {AbstractControl} control to validate
   * @returns {{ [key: string]: any } | null} eventual duplicate name error
   */
  validate(control: AbstractControl): { [key: string]: any } | null {
    return this.options ? nameDuplicateValidator(this.options)(control)
      : null;
  }

}
