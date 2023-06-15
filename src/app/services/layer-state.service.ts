import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject, catchError, merge, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { TLayer } from '../models/texto/t-layer';
import { LayerService } from './layer.service';
import { MessageConfigurationService } from './message-configuration.service';

@Injectable()
export class LayerStateService {
  addLayer = new Subject<TLayer>();
  removeLayer = new Subject<number>();
  updateLayer = new Subject<TLayer>();
  layers$ = merge(
    this.layerService.retrieveLayerList(),
    this.addLayer.pipe(
      switchMap(newLayer => this.layerService.createLayer(newLayer).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Layer "${newLayer.name}" added`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Adding layer "${newLayer.name}" failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.layerService.retrieveLayerList()),
    ),
    this.removeLayer.pipe(
      switchMap(layerId => this.layerService.removeLayerById(layerId).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Layer removed`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Removing layer failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.layerService.retrieveLayerList()),
    ),
    this.updateLayer.pipe(
      switchMap(updatedLayer => this.layerService.updateLayerById(updatedLayer).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Layer ${updatedLayer.name} updated`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Updating layer "${updatedLayer.name}" failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.layerService.retrieveLayerList()),
    ),
  ).pipe(
    shareReplay(1)
  );

  constructor(
    private layerService: LayerService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) {
    this.addLayer.subscribe();
    this.removeLayer.subscribe();
    this.updateLayer.subscribe();
  }
}
