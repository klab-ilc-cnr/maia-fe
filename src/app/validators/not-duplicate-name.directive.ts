import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidatorFn, Validators } from '@angular/forms';
import { whitespacesValidator } from './whitespaces-validator.directive';

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

/**
 * Sets on a control the validators of a name field that must also be unique: the base ones (by default required and not only
 * blanks) plus the duplication check, then evaluates the control again. `setValidators` REPLACES the validators of the control:
 * using it with the duplication check only, as was done, left the field without `required` after the first opening of the dialog.
 * @param control {AbstractControl} field to validate
 * @param names {string[]} names already in use
 * @param base {ValidatorFn[]} validators that must stay on the field
 */
export function setUniqueNameValidators(control: AbstractControl, names: string[], base: ValidatorFn[] = [Validators.required, whitespacesValidator]): void {
  control.setValidators([...base, nameDuplicateValidator(names)]);
  control.updateValueAndValidity();
}

/**Validation directive, defines whether an input value is already in a list of strings */
@Directive({
  selector: '[appNotDuplicateName]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: NotDuplicateNameDirective, multi: true }
  ],
  standalone: false
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
