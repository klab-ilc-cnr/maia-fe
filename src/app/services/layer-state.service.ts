import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject, catchError, merge, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { TLayer } from '../models/texto/t-layer';
import { LayerService } from './layer.service';
import { MessageConfigurationService } from './message-configuration.service';
import { TFeature } from '../models/texto/t-feature';
import { FeatureService } from './feature.service';

@Injectable()
export class LayerStateService {
  addFeature = new Subject<TFeature>();
  addLayer = new Subject<TLayer>();
  removeFeature = new Subject<TFeature>();
  removeLayer = new Subject<number>();
  retrieveLayerById = new Subject<number>();
  retrieveLayerFeatures = new Subject<number>();
  updateFeature = new Subject<TFeature>();
  updateLayer = new Subject<TLayer>();
  layer$ = this.retrieveLayerById.pipe(
    switchMap(layerId => this.layerService.retrieveLayerById(layerId).pipe(
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(`Error retrieving layer: ${error.error}`));
        return throwError(() => new Error(error.error));
      }),
  )),
  ).pipe(
    shareReplay(1)
  );
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

  features$ = merge(
    this.retrieveLayerFeatures.pipe(
      switchMap(layerId => this.layerService.retrieveLayerFeatureList(layerId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Retrieving layer features failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
    ),
    this.addFeature.pipe(
      switchMap(newFeature => this.featureService.createFeature(newFeature).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Feature "${newFeature.name}" added`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Adding feature "${newFeature.name}" failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(newFeature => this.layerService.retrieveLayerFeatureList(newFeature.layer!.id!)),
    ),
    this.updateFeature.pipe(
      switchMap(updatedFeature => this.featureService.updateFeatureById(updatedFeature).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Feature "${updatedFeature.name}" updated`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Updating feature "${updatedFeature.name}" failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(updatedFeature => this.layerService.retrieveLayerFeatureList(updatedFeature.layer!.id!)),
    ),
    this.removeFeature.pipe(
      switchMap(removedFeature => this.featureService.removeFeatureById(removedFeature.id!).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Feature "${removedFeature.name}" removed`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Removing feature "${removedFeature.name}" failed: ${error.error}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(removedFeature => this.layerService.retrieveLayerFeatureList(removedFeature.layer!.id!)),
    ),
  ).pipe(
    shareReplay(1),
  );

  constructor(
    private featureService: FeatureService,
    private layerService: LayerService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) {
    this.addFeature.subscribe();
    this.addLayer.subscribe();
    this.removeFeature.subscribe();
    this.removeLayer.subscribe();
    this.retrieveLayerById.subscribe();
    this.retrieveLayerFeatures.subscribe();
    this.updateFeature.subscribe();
    this.updateLayer.subscribe();
  }
}
