import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject, catchError, merge, shareReplay, switchMap, tap, throwError } from 'rxjs';
import { TFeature } from '../models/texto/t-feature';
import { TLayer } from '../models/texto/t-layer';
import { FeatureService } from './feature.service';
import { LayerService } from './layer.service';
import { MessageConfigurationService } from './message-configuration.service';

/**Service class for layer state management */
@Injectable()
export class LayerStateService {
  /**Subject to add a feature */
  addFeature = new Subject<TFeature>();
  /**Subject to add a layer */
  addLayer = new Subject<TLayer>();
  /**Subject to remove a feature */
  removeFeature = new Subject<TFeature>();
  /**Subject to remove a layer */
  removeLayer = new Subject<number>();
  /**Subject to retrieve a layer by ID */
  retrieveLayerById = new Subject<number>();
  /**Subject to retrieve the feature list of a layer */
  retrieveLayerFeatures = new Subject<number>();
  /**Subject to update a feature */
  updateFeature = new Subject<TFeature>();
  /**Subject to update a layer */
  updateLayer = new Subject<TLayer>();
  /**Observable of a layer */
  layer$ = this.retrieveLayerById.pipe(
    switchMap(layerId => this.layerService.retrieveLayerById(layerId).pipe(
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(`Error retrieving layer: ${error.error.message}`));
        return throwError(() => new Error(error.error));
      }),
    )),
  ).pipe(
    shareReplay(1)
  );
  /**Observable of the layer list */
  layers$ = merge(
    this.layerService.retrieveLayerList(),
    this.addLayer.pipe(
      switchMap(newLayer => this.layerService.createLayer(newLayer).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Layer "${newLayer.name}" added`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Adding layer "${newLayer.name}" failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.layerService.retrieveLayerList()),
    ),
    this.removeLayer.pipe(
      switchMap(layerId => this.layerService.removeLayerById(layerId).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Layer removed`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Removing layer failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.layerService.retrieveLayerList()),
    ),
    this.updateLayer.pipe(
      switchMap(updatedLayer => this.layerService.updateLayerById(updatedLayer).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Layer ${updatedLayer.name} updated`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Updating layer "${updatedLayer.name}" failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(() => this.layerService.retrieveLayerList()),
    ),
  ).pipe(
    shareReplay(1)
  );

  /**Observable of the feature list */
  features$ = merge(
    this.retrieveLayerFeatures.pipe(
      switchMap(layerId => this.layerService.retrieveLayerFeatureList(layerId).pipe(
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Retrieving layer features failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
    ),
    this.addFeature.pipe(
      switchMap(newFeature => this.featureService.createFeature(newFeature).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Feature "${newFeature.name}" added`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Adding feature "${newFeature.name}" failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(newFeature => this.layerService.retrieveLayerFeatureList(newFeature.layer!.id!)),
    ),
    this.updateFeature.pipe(
      switchMap(updatedFeature => this.featureService.updateFeatureById(updatedFeature).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Feature "${updatedFeature.name}" updated`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Updating feature "${updatedFeature.name}" failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(updatedFeature => this.layerService.retrieveLayerFeatureList(updatedFeature.layer!.id!)),
    ),
    this.removeFeature.pipe(
      switchMap(removedFeature => this.featureService.removeFeatureById(removedFeature.id!).pipe(
        tap(() => this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`Feature "${removedFeature.name}" removed`))),
        catchError((error: HttpErrorResponse) => {
          this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Removing feature "${removedFeature.name}" failed: ${error.error.message}`));
          return throwError(() => new Error(error.error));
        }),
      )),
      switchMap(removedFeature => this.layerService.retrieveLayerFeatureList(removedFeature.layer!.id!)),
    ),
  ).pipe(
    shareReplay(1),
  );

  /**
   * Constructor for LayerStateService
   * @param featureService {FeatureService} feature-related services
   * @param layerService {LayerService} layer-related services
   * @param messageService {MessageService} message-related services
   * @param msgConfService {MessageConfigurationService} services for message configuration
   */
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
