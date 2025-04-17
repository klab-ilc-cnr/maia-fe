import { Component, Input, TemplateRef, ViewChild, ElementRef, ContentChild } from '@angular/core';
import { Observable, Subscription, timer, of } from 'rxjs';
import { catchError, switchMap, timeout as rxjsTimeout } from 'rxjs/operators';

@Component({
  selector: 'app-async-tooltip',
  templateUrl: './async-tooltip.component.html',
  styleUrls: ['./async-tooltip.component.scss'],
})
export class AsyncTooltipComponent<T = any> {
  @Input() tooltipId!: string;
  @Input() tooltipParams?: any;

  @Input() fetchContent!: (id: string, params?: any) => Observable<T>; // 👈 T invece di string
  @Input() tooltipTemplate?: TemplateRef<any>;
  @Input() cache: boolean = false;
  @Input() delay: number = 0;
  @Input() timeout?: number;
  @Input() backgroundColor: string = '#323232'; // valore di default

  @ViewChild('tooltipTarget', { static: true }) tooltipTarget!: ElementRef;

  tooltipVisible = false;
  tooltipData: T | null = null;  // 👈 cambia da tooltipText a tooltipData
  tooltipX = 0;
  tooltipY = 0;

  private cacheMap = new Map<string, T>();
  private hoverSub?: Subscription;

  onMouseEnter(event: MouseEvent): void {
    this.tooltipX = event.clientX + 15;
    this.tooltipY = event.clientY + 15;
    this.tooltipVisible = true;

    const cacheKey = this.tooltipId + JSON.stringify(this.tooltipParams || {});
    if (this.cache && this.cacheMap.has(cacheKey)) {
      this.tooltipData = this.cacheMap.get(cacheKey)!;
      return;
    }

    this.tooltipData = null;

    this.hoverSub = timer(this.delay).pipe(
      switchMap(() => {
        const req = this.fetchContent(this.tooltipId, this.tooltipParams);
        return this.timeout ? req.pipe(rxjsTimeout(this.timeout)) : req;
      }),
      catchError(() => of(null as T)),
    ).subscribe(data => {
      this.tooltipData = data;
      if (this.cache) this.cacheMap.set(cacheKey, data);
    });
  }

  onMouseLeave(): void {
    this.tooltipVisible = false;
    this.tooltipData = null;
    this.hoverSub?.unsubscribe();
  }
}
