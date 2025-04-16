import { Component, Input, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { Observable, Subscription, timer, of } from 'rxjs';
import { catchError, switchMap, timeout as rxjsTimeout } from 'rxjs/operators';

@Component({
  selector: 'app-async-tooltip',
  templateUrl: './async-tooltip.component.html',
  styleUrls: ['./async-tooltip.component.scss'],
})
export class AsyncTooltipComponent {
  @Input() tooltipId!: string;
  @Input() tooltipParams?: any;
  @Input() fetchContent!: (id: string, params?: any) => Observable<string>;
  @Input() cache: boolean = false;
  @Input() delay: number = 0;
  @Input() timeout?: number;

  @ViewChild('tooltipTarget', { static: true }) tooltipTarget!: ElementRef;

  tooltipVisible = false;
  tooltipText: string | null = null;
  tooltipX = 0;
  tooltipY = 0;

  private cacheMap = new Map<string, string>();
  private hoverSub?: Subscription;

  onMouseEnter(event: MouseEvent): void {
    this.tooltipX = event.clientX + 15;
    this.tooltipY = event.clientY + 15;
    this.tooltipVisible = true;

    const cacheKey = this.tooltipId + JSON.stringify(this.tooltipParams || {});
    if (this.cache && this.cacheMap.has(cacheKey)) {
      this.tooltipText = this.cacheMap.get(cacheKey)!;
      return;
    }

    this.tooltipText = null; // reset for loading

    this.hoverSub = timer(this.delay).pipe(
      switchMap(() => {
        const req = this.fetchContent(this.tooltipId, this.tooltipParams);
        return this.timeout ? req.pipe(rxjsTimeout(this.timeout)) : req;
      }),
      catchError(() => of('Error loading tooltip')),
    ).subscribe(text => {
      this.tooltipText = text;
      if (this.cache) this.cacheMap.set(cacheKey, text);
    });
  }

  onMouseLeave(): void {
    this.tooltipVisible = false;
    this.tooltipText = null;
    this.hoverSub?.unsubscribe();
  }
}