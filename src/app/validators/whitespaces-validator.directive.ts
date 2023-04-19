import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';

/**
 * Funzione di validazione che verifica se il valore di un input è costituito unicamente da spazi
 * @param control {AbstractControl} controllo da validare
 * @returns {ValidationErrors|null} eventuali errori
 */
export const whitespacesValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (!control || !control.value) { return null; }
  const error = { 'isNotOnlyWhitespaces': true };

  if (!control.value.trim()) {
    return error;
  }
  return null;
}

/**Direttiva di validazione che controlla se un input è costituito unicamente da spazi */
@Directive({
  selector: '[appWhitespacesValidator]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: WhitespacesValidatorDirective, multi: true }
  ]
})
export class WhitespacesValidatorDirective implements Validator {
  /**
   * Metodo dell'interfaccia Validator che controlla se un input è costituito unicamente da spazi
   * @param control {AbstactControl} campo da validare
   * @returns {ValidationErrors|null} eventuali errori
   */
  public validate(control: AbstractControl): ValidationErrors | null {
    return whitespacesValidator(control)
  }
}
