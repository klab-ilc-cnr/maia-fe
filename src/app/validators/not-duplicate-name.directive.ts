import { Directive, Input } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, ValidatorFn } from '@angular/forms';

const VALIDATOR_ERROR = { 'notDuplicateName': true };

export function nameDuplicateValidator(options: string[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    console.log('hi')
      if ((!options)) {
        return null;
      }

      let elem = options.find((item: any) => item == control.value);

      if (!elem) { return null; }

      return VALIDATOR_ERROR;
  };
}

@Directive({
  selector: '[appNotDuplicateName]',
  providers: [
    { provide: NG_VALIDATORS, useExisting: NotDuplicateNameDirective, multi: true }
  ]
})
export class NotDuplicateNameDirective {
  @Input('appNotDuplicateName')
  options: string[] = [];

  validate(control: AbstractControl): { [key: string]: any } | null {
    return this.options ? nameDuplicateValidator(this.options)(control)
      : null;
  }

}
