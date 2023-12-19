import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn } from '@angular/forms';

/**
 * Validation function that checks whether the value of an input consists only of spaces
 * @param control {AbstractControl} control to validate
 * @returns {ValidationErrors|null} any errors
 */
export const whitespacesValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control || !control.value) { return null; }
  const error = { 'isNotOnlyWhitespaces': true };

  if (!control.value.trim()) {
    return error;
  }
  return null;
}

/**Validation directive that checks whether an input consists only of spaces */
@Directive({
  selector: '[appWhitespacesValidator]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: WhitespacesValidatorDirective, multi: true }
  ]
})
export class WhitespacesValidatorDirective implements Validator {
  /**
   * Validator interface method that checks whether an input consists solely of spaces
   * @param control {AbstactControl} control to validate
   * @returns {ValidationErrors|null} any errors
   */
  public validate(control: AbstractControl): ValidationErrors | null {
    return whitespacesValidator(control)
  }
}
