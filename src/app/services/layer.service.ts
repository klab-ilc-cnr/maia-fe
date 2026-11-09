import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { TFeature, TFeatureType } from '../models/texto/t-feature';
import { TLayer } from '../models/texto/t-layer';
import { TtlCache } from '../helpers/ttl-cache';

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
    return this.invalidating(this.http.post<TLayer>(
      `${this.textoUrl}/layer/create`,
      newLayer,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    ));
  }

  /**
   * Delete annotation layer by ID
   * @param layerId {number} layer identifier
   * @returns {Observable<TLayer>} removed layer
   */
  public removeLayerById(layerId: number): Observable<TLayer> {
    const uuid = uuidv4();
    return this.invalidating(this.http.delete<TLayer>(
      `${this.textoUrl}/layer/${layerId}/remove`,
      {
        headers: new HttpHeaders({ 'UUID': uuid })
      },
    ));
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

  /** features of a layer (cached 5 minutes, see `retrieveLayerFeatureListCached`) */
  private featuresCache = new TtlCache<number, TFeature[]>(5 * 60 * 1000);
  /** list of the layers (cached 5 minutes, see `retrieveLayerListCached`) */
  private listCache = new TtlCache<string, TLayer[]>(5 * 60 * 1000);
  /** layers by id (cached 5 minutes, see `retrieveLayerByIdCached`) */
  private layerCache = new TtlCache<number, TLayer>(5 * 60 * 1000);

  /**
   * Same as `retrieveLayerFeatureList`, but the answer is reused for 5 minutes (it is the structure of the layer, it changes
   * rarely). For the annotation editors, that ask for it at every click on an annotation. The administration pages
   * keep reading fresh data.
   * @param layerId {number} layer identifier
   */
  public retrieveLayerFeatureListCached(layerId: number): Observable<TFeature[]> {
    return this.featuresCache.get(layerId, () => this.retrieveLayerFeatureList(layerId));
  }

  /**
   * Same as `retrieveLayerById`, with the answer reused for 5 minutes.
   * @param layerId {number} layer identifier
   */
  public retrieveLayerByIdCached(layerId: number): Observable<TLayer> {
    return this.layerCache.get(layerId, () => this.retrieveLayerById(layerId));
  }

  /**
   * Same as `retrieveLayerList`, with the answer reused for 5 minutes. For the text window, that asked for the list at every opening.
   */
  public retrieveLayerListCached(): Observable<TLayer[]> {
    return this.listCache.get('list', () => this.retrieveLayerList());
  }

  /** Forgets the cached layers and features: to call after any change of a layer or of its features */
  public clearCache(): void {
    this.listCache.clear();
    this.featuresCache.clear();
    this.layerCache.clear();
    this.semanticLayer$ = undefined;
  }

  /** Makes a request that changes layers invalidate the cache when it succeeds */
  private invalidating<T>(request: Observable<T>): Observable<T> {
    return request.pipe(tap(() => this.clearCache()));
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
    return this.invalidating(this.http.post<TLayer>(
      `${this.textoUrl}/layer/update`,
      updatedLayer,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    ));
  }
}
