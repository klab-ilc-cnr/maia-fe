import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { Layer } from '../models/layer/layer.model';
import { TLayer } from '../models/texto/t-layer';

/**Classe dei servizi relativi ai layer */
@Injectable({
  providedIn: 'root'
})
export class LayerService {
  private textoUrl: string;
  /**Url per le chiamate relative ai layer */
  private layerUrl: string;

  /**
   * Costruttore per LayerService
   * @param http {HttpClient} effettua le chiamate HTTP
   */
  constructor(private http: HttpClient) {
    this.layerUrl = environment.layersUrl; //inizializza gli url sulla base degli environment
    this.textoUrl = environment.textoUrl;
  }

  /**
   * GET che recupera l'elenco dei layer esistenti
   * @returns {Observable<Array<Layer>>} observable della lista di layer
   */
  public retrieveLayers(): Observable<Array<Layer>> {
    return this.http.get<Array<Layer>>(`${this.layerUrl}`);
  }

  /**
   * PUT che richiede la modifica dei dati di un layer
   * @param layer {Layer} layer modificato
   * @returns {Observable<Layer>} observable del layer modificato
   */
  public updateLayer(layer: Layer): Observable<Layer> {
    return this.http.put<Layer>(`${this.layerUrl}`, layer);
  }

  /**
   * DELETE per la cancellazione di un layer
   * @param layerId {number|undefined} identificativo numerico del layer
   * @returns {Observable<number>} ?
   */
  public deleteLayer(layerId: number | undefined): Observable<number> {
    return this.http.delete<number>(`${this.layerUrl}/${layerId}`);
  }

  /**
   * POST per la creazione di un nuovo layer
   * @param layer {Layer} nuovo layer
   * @returns {Observable<Layer>} observable del nuovo layer
   */
  public createLayer(layer: Layer): Observable<Layer> {
    return this.http.post<Layer>(`${this.layerUrl}`, layer);
  }

  //FEATURES


  //#region TEXTO services

  public getLayerList(): Observable<TLayer[]> {
    const uuid = uuidv4();
    return this.http.get<TLayer[]>(
      `${this.textoUrl}/texto/layer/list`,
      {
        headers: new HttpHeaders({ 'UUID': uuid })
      },
    )
  }

  public postCreateLayer(newLayer: TLayer): Observable<TLayer> {
    const uuid = uuidv4();
    return this.http.post<TLayer>(
      `${this.textoUrl}/texto/layer/create`,
      newLayer,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    );
  }

  //#endregion
}
