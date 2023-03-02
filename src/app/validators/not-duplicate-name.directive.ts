import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidatorFn } from '@angular/forms';

/**Errore di validazione sulla duplicazione dei nomi */
const VALIDATOR_ERROR = { 'notDuplicateName': true };

/**
 * Funzione che valuta se il valore di un campo di input è già presente in una lista di stringhe
 * @param options {string[]} nomi sui quali valutare duplicazione
 * @returns {ValidatorFn} restituisce un eventuale errore di validazione della duplicazione
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

/**Direttiva di validazione, definisce se un valore di input è già presente in una lista di stringhe */
@Directive({
  selector: '[appNotDuplicateName]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: NotDuplicateNameDirective, multi: true }
  ]
})
export class NotDuplicateNameDirective {
  /**Lista di stringhe sulle quali effettuale la validazione */
  @Input('appNotDuplicateName')
  options: string[] = [];

  /**
   * Metodo dell'interfaccia Validator che verifica se il valore di un campo di input è già presente in una lista di stringhe
   * @param control {AbstractControl} campo di input da validare
   * @returns {{ [key: string]: any } | null} eventuale errore di duplicazione nomi
   */
  validate(control: AbstractControl): { [key: string]: any } | null {
    return this.options ? nameDuplicateValidator(this.options)(control)
      : null;
  }

}
