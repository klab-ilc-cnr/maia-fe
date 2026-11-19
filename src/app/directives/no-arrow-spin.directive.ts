import { Directive, ElementRef, NgZone, OnDestroy, OnInit } from '@angular/core';

/**
 * Disables the change of the value with the ArrowUp / ArrowDown keys in every PrimeNG number field (`p-inputNumber`).
 *
 * By default these keys increment / decrement the value: moving around the form, or scrolling the page with the
 * keyboard while the field has the focus, changes the number by mistake (e.g. "Occ. altre opere" of the dictionary entry).
 * The listener is on the host in the capture phase and stops the event before it reaches the PrimeNG input handler.
 * The value can still be typed, and the other keys (Tab, Home, End, Left / Right...) keep working.
 */
@Directive({
  selector: 'p-inputNumber, p-inputnumber, p-input-number',
  standalone: false
})
export class NoArrowSpinDirective implements OnInit, OnDestroy {
  constructor(private readonly host: ElementRef<HTMLElement>, private readonly zone: NgZone) { }

  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => this.host.nativeElement.addEventListener('keydown', this.onKeydown, true));
  }

  ngOnDestroy(): void {
    this.host.nativeElement.removeEventListener('keydown', this.onKeydown, true);
  }
}
