import { Directive, Input } from '@angular/core';
import { TagsetValue } from '../models/tagset/tagset-value';
import { AbstractControl, NG_VALIDATORS, ValidatorFn } from '@angular/forms';

/**Errore di duplicazione del nome di un valore di un tagset */
const VALIDATOR_ERROR = { 'tagsetValueNotDuplicateName': true };

/**
 * Funzione che valuta se il nome del valore di un tagset è un duplicato
 * @param options {TagsetValue[]} lista di valori di un tagset
 * @returns {ValidatorFn} restituisce eventuali errori di duplicazione
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

/**Direttiva di validazione del nome di un valore di un tagset affinché non costituisca un duplicato */
@Directive({
  selector: '[appTagsetValueNotDuplicateName]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: TagsetValueNotDuplicateNameDirective, multi: true }
  ]
})
export class TagsetValueNotDuplicateNameDirective {
  /**Lista di valori di un tagset sui quali effettuare il controllo */
  @Input('appTagsetValueNotDuplicateName')
  options: TagsetValue[] = [];

  /**
   * Metodo dell'interfaccia Validator che verifica se il nome di un valore di un tagset costituisce un duplicato
   * @param control {AbstractControl} campo di input da validare
   * @returns {{ [key: string]: any } | null} eventuale errore di duplicazione
   */
  validate(control: AbstractControl): { [key: string]: any } | null {
    return this.options ? TagsetValueNameDuplicateValidator(this.options)(control)
        : null;
  }
}
