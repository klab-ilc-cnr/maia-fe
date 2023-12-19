import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn } from '@angular/forms';

/**
 * Validation function that checks that the uri is correctly formed
 * @param control {AbstractControl} control to validate
 * @returns {ValidatorFn} returns any validation errors
 */
export const uriValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control || !control.value) { return null; }
    const error = { 'isValidUri': true };

    if (new RegExp('(https?://)+([\\da-z.-]+)').test(control.value)) {
        return null;
    }
    return error;
}

/**Directive for the validation of a uri */
@Directive({
    selector: '[appUriValidator]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: UriValidator, multi: true }
    ]
})
export class UriValidator implements Validator {
    /**
     * Validator interface method that verifies that a uri is correctly formed
     * @param control {AbstractControl} control to validate
     * @returns {ValidationErrors|null} any validation errors
     */
    public validate(control: AbstractControl): ValidationErrors | null {
        return uriValidator(control)
    }
}
