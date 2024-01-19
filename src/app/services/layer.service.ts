import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { Layer } from '../models/layer/layer.model';
import { TFeature } from '../models/texto/t-feature';
import { TLayer } from '../models/texto/t-layer';

/**Class of services related to layers */
@Injectable({
  providedIn: 'root'
})
export class LayerService {
  /**Url for texto-related requests */
  private textoUrl: string;
  /**Url for layer-related requests */
  private layerUrl: string;

  /**
   * Constructor for LayerService
   * @param http {HttpClient} Performs HTTP requests
   */
  constructor(private http: HttpClient) {
    this.layerUrl = environment.layersUrl; //inizializza gli url sulla base degli environment
    this.textoUrl = environment.maiaBeTextoUrl;
  }

  /**
   * GET che recupera l'elenco dei layer esistenti
   * @returns {Observable<Array<Layer>>} observable della lista di layer
   */
  // public retrieveLayers(): Observable<Array<Layer>> {  //TODO CHECK TO REMOVE @MPapini91
  //   return this.http.get<Array<Layer>>(`${this.layerUrl}`);
  // }

  /**
   * PUT che richiede la modifica dei dati di un layer
   * @param layer {Layer} layer modificato
   * @returns {Observable<Layer>} observable del layer modificato
   */
  public _updateLayer(layer: Layer): Observable<Layer> { //TODO CHECK TO REMOVE @MPapini91
    return this.http.put<Layer>(`${this.layerUrl}`, layer);
  }

  /**
   * DELETE per la cancellazione di un layer
   * @param layerId {number|undefined} identificativo numerico del layer
   * @returns {Observable<number>} ?
   */
  public deleteLayer(layerId: number | undefined): Observable<number> { //TODO CHECK TO REMOVE @MPapini91
    return this.http.delete<number>(`${this.layerUrl}/${layerId}`);
  }

  /**
   * POST per la creazione di un nuovo layer
   * @param layer {Layer} nuovo layer
   * @returns {Observable<Layer>} observable del nuovo layer
   */
  public _createLayer(layer: Layer): Observable<Layer> { //TODO CHECK TO REMOVE @MPapini91
    return this.http.post<Layer>(`${this.layerUrl}`, layer);
  }

  //FEATURES


  //#region TEXTO services

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
      `${this.textoUrl}/layer/${updatedLayer.id}/update`,
      updatedLayer,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    );
  }

  //#endregion
}
