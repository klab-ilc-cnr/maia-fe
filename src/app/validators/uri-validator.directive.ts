import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidatorFn, ValidationErrors, Validators } from '@angular/forms';

/**
 * Funzione di validazione che controlla che l'uri sia correttamente formato
 * @param control {AbstractControl} campo di input da validare
 * @returns {ValidatorFn} restituisce eventuali errori di validazione
 */
export const uriValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control || !control.value) { return null; }
    const error = { 'isValidUri': true };

    if (new RegExp('(https?://)+([\\da-z.-]+)').test(control.value)) {
        return null;
    }
    return error;
}

/**Direttiva per la validazione di un uri */
@Directive({
    selector: '[appUriValidator]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: UriValidator, multi: true }
    ]
})
export class UriValidator implements Validator {
    /**
     * Metodo dell'interfaccia Validator che verifica che un uri sia correttamente formato
     * @param control {AbstractControl} campo di input da validare
     * @returns {ValidationErrors|null} eventuale errore di validazione
     */
    public validate(control: AbstractControl): ValidationErrors | null {
        return uriValidator(control)
    }
}
