import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn } from '@angular/forms';

/**
 * Function that evaluates whether the new password and the confirmation password are equals
 * @param control {AbstractControl} control to validate
 * @returns {ValidatorFn|null} returns a possible mismatch validation error
 */
export const matchNewPassword: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control || !control.value) { return null; }
  const error = { 'isMatchPasswordError': true };
  const newPassword = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (newPassword === confirmPassword) { return null; }
  return error;
}

/**Validation directive, defines whether the new password matchs confirmation password */
@Directive({
  selector: '[appMatchNewPassword]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: matchNewPassword, multi: true },
  ]
})
export class MatchNewPasswordDirective implements Validator {

  /**
   * Validator interface method that checks whether the new password matchs confirmation password
   * @param control {AbstractControl} control to validate
   * @returns {ValidationErrors|null} any mismatch validation error
   */
  public validate(control: AbstractControl): ValidationErrors | null {
    return matchNewPassword(control);
  }

}
