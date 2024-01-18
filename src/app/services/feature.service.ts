import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { Feature } from '../models/feature/feature';
import { TFeature } from '../models/texto/t-feature';
/**Class of feature-related services */
@Injectable({
  providedIn: 'root'
})
export class FeatureService {
  /**Url for feature-related requests */
  private featureUrl: string;
  /**Url for texto-related requests */
  private textoUrl: string;

  /**
   * Constructor for FeatureService
   * @param http {HttpClient} Performs HTTP requests
   */
  constructor(private http: HttpClient) {
    this.featureUrl = environment.featureUrl;
    this.textoUrl = environment.textoUrl;
  }

  /**
   * GET che recupera la lista di feature associate a un layer
   * @param layerId {number} identificativo numerico del layer
   * @returns {Observable<Feature[]>} observable della lista di feature associate al layer
   */
  public retrieveFeaturesByLayerId(layerId: number): Observable<Feature[]> {  //TODO CHECK TO REMOVE @MPapini91

    return this.http.get<Feature[]>(`${this.featureUrl}/${layerId}`);
  }

  /**
   * POST che richiede la creazione di una nuova feature
   * @param item {any} la feature in creazione
   * @returns {Observable<any>} observable della feature in creazione
   */
  public _createFeature(item: any): Observable<any> { //TODO CHECK TO REMOVE @MPapini91
    return this.http.post<any>(`${this.featureUrl}`, item);
  }

  /**
   * PUT che richiede la modifica dei dati di una feature
   * @param item {any} feature modificata
   * @returns {Observable<any>} observable della feature modificata
   */
  public updateFeature(item: any): Observable<any> {  //TODO CHECK TO REMOVE @MPapini91
    return this.http.put<any>(`${this.featureUrl}`, item);
  }

  /**
   * DELETE per l'eliminazione di una feature da un layer
   * @param layerId {number} identificativo del layer di appartenenza
   * @param featureId {number} identificativo della feature
   * @returns {Observable<boolean>} observable dell'esito dell'operazione
   */
  public deleteFeature(layerId: number, featureId: number): Observable<boolean> { //TODO CHECK TO REMOVE @MPapini91
    return this.http.delete<boolean>(`${this.featureUrl}/${layerId}/${featureId}`);
  }

  /**
   * GET che richiede se la feature di un layer può essere rimossa
   * @param layerId {number} identificativo numerico del layer
   * @param featureId {number} identificativo numerico della feature
   * @returns {Observable<boolean>} observable del booleano che definisce se la feature di un layer può essere cancellata
   */
  public retrieveCanBeDeleted(layerId: number, featureId: number): Observable<boolean> {  //TODO CHECK TO REMOVE @MPapini91

    return this.http.get<boolean>(`${this.featureUrl}/canbedeleted/${layerId}/${featureId}`);
  }

  //#region TEXTO

  /**
   * POST to add a new feature
   * @param newFeature {TFeature} new feature to be added
   * @returns {Observable<TFeature>} new feature added
   */
  public createFeature(newFeature: TFeature): Observable<TFeature> {
    const uuid = uuidv4();
    return this.http.post<TFeature>(
      `${this.textoUrl}/texto/feature/create`,
      newFeature,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    );
  }

  /**
   * Delete a feature by ID
   * @param featureId {number} feature identifier
   * @returns {Observable<TFeature>} observable of the removed feature
   */
  public removeFeatureById(featureId: number): Observable<TFeature> {
    const uuid = uuidv4();
    return this.http.delete<TFeature>(
      `${this.textoUrl}/texto/feature/${featureId}/remove`,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    );
  }

  /**
   * POST to update a feature
   * @param updatedFeature {TFeature} feature to be updated
   * @returns {Observable<TFeature>} observable of the updated feature
   */
  public updateFeatureById(updatedFeature: TFeature): Observable<TFeature> {
    const uuid = uuidv4();
    return this.http.post<TFeature>(
      `${this.textoUrl}/texto/feature/${updatedFeature.id}/update`,
      updatedFeature,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    );
  }

  //#endregion
}
