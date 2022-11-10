import { Directive } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidatorFn, ValidationErrors, Validators } from '@angular/forms';

export const uriValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    if (!control || !control.value) { return null; }
    const error = { 'isValidUri': true };

    if (new RegExp('(https?://)+([\\da-z.-]+)').test(control.value)) {
        return null;
    }
    return error;
}

@Directive({
    selector: '[appUriValidator]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: UriValidator, multi: true }
    ]
})
export class UriValidator implements Validator {
    public validate(control: AbstractControl): ValidationErrors | null {
        return uriValidator(control)
    }
}
