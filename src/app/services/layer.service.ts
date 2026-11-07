import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { TFeature, TFeatureType } from '../models/texto/t-feature';
import { TLayer } from '../models/texto/t-layer';

/**Class of services related to layers */
@Injectable({
  providedIn: 'root'
})
export class LayerService {
  /**Url for texto-related requests */
  private textoUrl: string;

  /**
   * Constructor for LayerService
   * @param http {HttpClient} Performs HTTP requests
   */
  constructor(private http: HttpClient) {
    this.textoUrl = environment.maiaBeTextoUrl;
  }

  /**
   * POST to add a new layer
   * @param newLayer {TLayer} layer to be added
   * @returns {Observable<TLayer>} observable of the new layer
   */
  public createLayer(newLayer: TLayer): Observable<TLayer> {
    const uuid = uuidv4();
    return this.http.post<TLayer>(
      `${this.textoUrl}/layer/create`,
      newLayer,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    );
  }

  /**
   * Delete annotation layer by ID
   * @param layerId {number} layer identifier
   * @returns {Observable<TLayer>} removed layer
   */
  public removeLayerById(layerId: number): Observable<TLayer> {
    const uuid = uuidv4();
    return this.http.delete<TLayer>(
      `${this.textoUrl}/layer/${layerId}/remove`,
      {
        headers: new HttpHeaders({ 'UUID': uuid })
      },
    )
  }

  /**
   * GET to retrieve layer data by ID
   * @param layerId {number} layer identifier
   * @returns {Observable<TLayer>} observable of the retrieved layer
   */
  public retrieveLayerById(layerId: number): Observable<TLayer> {
    const uuid = uuidv4();
    return this.http.get<TLayer>(
      `${this.textoUrl}/layer/${layerId}`,
      {
        headers: new HttpHeaders({ 'UUID': uuid })
      },
    )
  }

  /**
   * GET to retrieve the list of features associated with a layer
   * @param layerId {number} layer identifier
   * @returns {Observable<TFeature[]} observable of the list of features
   */
  public retrieveLayerFeatureList(layerId: number): Observable<TFeature[]> {
    return this.http.get<TFeature[]>(`${this.textoUrl}/layer/${layerId}/features`);
  }

  /** cached semantic layer lookup (see `retrieveSemanticLayer`) */
  private semanticLayer$?: Observable<TLayer | undefined>;

  /**
   * Retrieves the semantic layer: the one that has a feature of type SENSE (the layer where a sense is annotated).
   * The answer is cached; a failed request is not.
   * @returns {Observable<TLayer | undefined>} the layer, or undefined if there is none
   */
  public retrieveSemanticLayer(): Observable<TLayer | undefined> {
    if (!this.semanticLayer$) {
      this.semanticLayer$ = this.retrieveLayerList().pipe(
        switchMap(layers => layers.length === 0 ? of([]) : forkJoin(layers.map(layer =>
          this.retrieveLayerFeatureList(layer.id!).pipe(map(features => ({ layer, features })))))),
        map(entries => entries.find(e => e.features.some(f => f.type === TFeatureType.SENSE))?.layer),
        catchError(error => { this.semanticLayer$ = undefined; throw error; }),
        shareReplay(1),
      );
    }
    return this.semanticLayer$;
  }

  /**
   * GET to retrieve layers list 
   * @returns {Observable<TLayer[]>} observable of the layers list
   */
  public retrieveLayerList(): Observable<TLayer[]> {
    const uuid = uuidv4();
    return this.http.get<TLayer[]>(
      `${this.textoUrl}/layer/list`,
      {
        headers: new HttpHeaders({ 'UUID': uuid })
      },
    )
  }

  /**
   * POST to update a layer
   * @param updatedLayer {TLayer} layer to be updated
   * @returns {Observable<TLayer>} observable of the updated layer
   */
  public updateLayerById(updatedLayer: TLayer): Observable<TLayer> {
    const uuid = uuidv4();
    return this.http.post<TLayer>(
      `${this.textoUrl}/layer/update`,
      updatedLayer,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    );
  }
}
