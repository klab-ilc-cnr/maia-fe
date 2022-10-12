import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

export const whitespacesValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control || !control.value) { return null; }
  const error = { 'isNotOnlyWhitespaces': true };

  if (!control.value.trim()) {
    return error;
  }
  return null;
}

@Directive({
  selector: '[appWhitespacesValidator]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: WhitespacesValidatorDirective, multi: true }
  ]
})
export class WhitespacesValidatorDirective implements Validator {
  public validate(control: AbstractControl): ValidationErrors | null {
    return whitespacesValidator(control)
  }
}
