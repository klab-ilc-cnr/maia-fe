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

  @Input() fetchContent!: (id: string, params?: any) => Observable<T>;
  @Input() tooltipTemplate?: TemplateRef<any>;
  @Input() cache: boolean = false;
  @Input() delay: number = 0;
  @Input() timeout?: number;
  @Input() backgroundColor: string = '#323232';
  @Input() keepVisibleOnMouseLeave: boolean = false;

  @ViewChild('tooltipTarget', { static: true }) tooltipTarget!: ElementRef;

  tooltipVisible = false;
  tooltipData: T | null = null;
  tooltipX = 0;
  tooltipY = 0;
  errorMessage: string | null = null;

  private cacheMap = new Map<string, T>();
  private hoverSub?: Subscription;
  private isTooltipHovered = false;
  private hideTooltipTimeout?: any;
  private shouldRecalculateHeight = false;

  /**
   * @public
   * Metodo che gestisce l'evento di mouse enter sul target del tooltip.
   * Mostra il tooltip e avvia il caricamento asincrono del contenuto.
   * @param event {MouseEvent} evento del mouse
   */
  onMouseEnter(event: MouseEvent): void {
    // Close any existing tooltip immediately
    this.tooltipVisible = false;
    this.tooltipData = null;
    this.errorMessage = null;
    this.hoverSub?.unsubscribe();
    clearTimeout(this.hideTooltipTimeout);

    // Reset recalculation flag to ensure proper height calculation
    this.shouldRecalculateHeight = false;

    this.tooltipX = event.clientX + 15;
    this.tooltipY = event.clientY + 15;

    // Delay showing the tooltip slightly to ensure proper cleanup
    setTimeout(() => {
      this.tooltipVisible = true;
      this.shouldRecalculateHeight = true;
    }, 50);

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
        this.errorMessage = 'Content could not be loaded. Please try again.';
        return of(null as T);
      }),
    ).subscribe(data => {
      if (data !== null) {
        this.tooltipData = data;
        if (this.cache) this.cacheMap.set(cacheKey, data);
      }
      this.recalculateMaxHeight();
    });
  }

  /**
   * @public
   * Metodo del ciclo di vita Angular chiamato dopo ogni controllo della vista.
   * Utilizzato per ricalcolare l'altezza massima del tooltip se necessario.
   */
  ngAfterViewChecked(): void {
    if (this.shouldRecalculateHeight && this.tooltipVisible) {
      this.recalculateMaxHeight();
      this.shouldRecalculateHeight = false;
    }
  }

  /**
   * @public
   * Metodo che gestisce l'evento di mouse leave sul target del tooltip.
   * Nasconde il tooltip immediatamente o con un ritardo, a seconda della configurazione.
   */
  onMouseLeave(): void {
    if (this.keepVisibleOnMouseLeave) {
      this.hideTooltipTimeout = setTimeout(() => {
        if (!this.isTooltipHovered) {
          this.tooltipVisible = false;
          this.tooltipData = null;
          this.hoverSub?.unsubscribe();
        }
      }, 200);
    } else {
      this.tooltipVisible = false;
      this.tooltipData = null;
      this.hoverSub?.unsubscribe();
    }
  }

  /**
   * @public
   * Metodo che gestisce l'evento di mouse enter sul tooltip stesso.
   * Impedisce che il tooltip venga nascosto mentre il mouse è sopra di esso.
   */
  onTooltipMouseEnter(): void {
    this.isTooltipHovered = true;
    if (this.hideTooltipTimeout) {
      clearTimeout(this.hideTooltipTimeout);
    }
  }

  /**
   * @public
   * Metodo che gestisce l'evento di mouse leave sul tooltip stesso.
   * Nasconde il tooltip con un ritardo se il mouse lascia il tooltip.
   */
  onTooltipMouseLeave(): void {
    this.isTooltipHovered = false;
    if (this.keepVisibleOnMouseLeave) {
      this.hideTooltipTimeout = setTimeout(() => {
        if (!this.isTooltipHovered) {
          this.tooltipVisible = false;
          this.tooltipData = null;
          this.hoverSub?.unsubscribe();
        }
      }, 300);
    }
  }

  /**
   * @private
   * Metodo che ricalcola l'altezza massima del tooltip in base alla posizione e all'altezza della finestra.
   * Imposta lo stile CSS `maxHeight` per evitare che il tooltip esca dallo schermo.
   */
  private recalculateMaxHeight(): void {
    const viewportHeight = window.innerHeight;
    const tooltipStartY = this.tooltipY;
    const maxHeight = viewportHeight - tooltipStartY - 10;
    const tooltipElement = document.querySelector('.custom-primeng-tooltip') as HTMLElement;
    if (tooltipElement) {
      tooltipElement.style.maxHeight = `${maxHeight}px`;
    }
  }
}
