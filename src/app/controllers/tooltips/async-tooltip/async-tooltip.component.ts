import { Component, Input, TemplateRef, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { Observable, Subscription, timer, of } from 'rxjs';
import { catchError, switchMap, timeout as rxjsTimeout } from 'rxjs/operators';

@Component({
  selector: 'app-async-tooltip',
  templateUrl: './async-tooltip.component.html',
  styleUrls: ['./async-tooltip.component.scss'],
})
export class AsyncTooltipComponent<T = any> implements AfterViewChecked {
  @Input() tooltipId!: string;
  @Input() tooltipParams?: any;

  @Input() fetchContent!: (id: string, params?: any) => Observable<T>; // 👈 T invece di string
  @Input() tooltipTemplate?: TemplateRef<any>;
  @Input() cache: boolean = false;
  @Input() delay: number = 0;
  @Input() timeout?: number;
  @Input() backgroundColor: string = '#323232'; // valore di default
  @Input() keepVisibleOnMouseLeave: boolean = false; // New input property

  @ViewChild('tooltipTarget', { static: true }) tooltipTarget!: ElementRef;

  tooltipVisible = false;
  tooltipData: T | null = null;  // 👈 cambia da tooltipText a tooltipData
  tooltipX = 0;
  tooltipY = 0;
  errorMessage: string | null = null; // property for error or timeout messages

  private cacheMap = new Map<string, T>();
  private hoverSub?: Subscription;
  private isTooltipHovered = false;
  private hideTooltipTimeout?: any;
  private shouldRecalculateHeight = false;

  onMouseEnter(event: MouseEvent): void {
    // Close any existing tooltip immediately
    this.tooltipVisible = false;
    this.tooltipData = null;
    this.errorMessage = null; // Reset error message
    this.hoverSub?.unsubscribe();
    clearTimeout(this.hideTooltipTimeout);

    // Reset recalculation flag to ensure proper height calculation
    this.shouldRecalculateHeight = false;

    this.tooltipX = event.clientX + 15;
    this.tooltipY = event.clientY + 15;

    // Delay showing the tooltip slightly to ensure proper cleanup
    setTimeout(() => {
      this.tooltipVisible = true;
      this.shouldRecalculateHeight = true; // Mark for recalculation after rendering
    }, 50); // Small delay to allow cleanup

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
      catchError(() => {
        // Set error message on timeout or error
        this.errorMessage = 'Content could not be loaded. Please try again.';
        return of(null as T);
      }),
    ).subscribe(data => {
      if (data !== null) {
        this.tooltipData = data;
        if (this.cache) this.cacheMap.set(cacheKey, data);
      }
      // Recalculate max-height after data is loaded or on error
      this.recalculateMaxHeight();
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldRecalculateHeight && this.tooltipVisible) {
      this.recalculateMaxHeight();
      this.shouldRecalculateHeight = false;
    }
  }

  onMouseLeave(): void {
    if (this.keepVisibleOnMouseLeave) {
      this.hideTooltipTimeout = setTimeout(() => {
        if (!this.isTooltipHovered) {
          this.tooltipVisible = false;
          this.tooltipData = null;
          this.hoverSub?.unsubscribe();
        }
      }, 200); // Delay hiding the tooltip by 300ms
    } else {
      this.tooltipVisible = false;
      this.tooltipData = null;
      this.hoverSub?.unsubscribe();
    }
  }

  onTooltipMouseEnter(): void {
    this.isTooltipHovered = true;
    if (this.hideTooltipTimeout) {
      clearTimeout(this.hideTooltipTimeout); // Cancel hiding if the mouse enters the tooltip
    }
  }

  onTooltipMouseLeave(): void {
    this.isTooltipHovered = false;
    if (this.keepVisibleOnMouseLeave) {
      this.hideTooltipTimeout = setTimeout(() => {
        if (!this.isTooltipHovered) {
          this.tooltipVisible = false;
          this.tooltipData = null;
          this.hoverSub?.unsubscribe();
        }
      }, 300); // Delay hiding the tooltip by 300ms
    }
  }

  private recalculateMaxHeight(): void {
    const viewportHeight = window.innerHeight;
    const tooltipStartY = this.tooltipY;
    const maxHeight = viewportHeight - tooltipStartY - 10; // Leave a 10px margin from the bottom
    const tooltipElement = document.querySelector('.custom-primeng-tooltip') as HTMLElement;
    if (tooltipElement) {
      tooltipElement.style.maxHeight = `${maxHeight}px`;
    }
  }
}
