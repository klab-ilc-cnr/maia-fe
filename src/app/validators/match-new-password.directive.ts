import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn } from '@angular/forms';

export const matchNewPassword: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control || !control.value) { return null; }
  const error = { 'isMatchPasswordError': true };
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (newPassword === confirmPassword) { return null; }
  return error;
}

@Directive({
  selector: '[appMatchNewPassword]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: matchNewPassword, multi: true },
  ]
})
export class MatchNewPasswordDirective implements Validator {

  public validate(control: AbstractControl): ValidationErrors | null {
    return matchNewPassword(control);
  }

}
