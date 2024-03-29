import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Feature } from '../models/feature/feature';
import { TFeature } from '../models/texto/t-feature';
import { v4 as uuidv4 } from 'uuid';
/**Classe dei servizi relativi alle feature */
@Injectable({
  providedIn: 'root'
})
export class FeatureService {

  /**Url per le richieste relative alle feature */
  private featureUrl: string;
  private textoUrl: string;

  /**
   * Costruttore per FeatureService
   * @param http {HttpClient} effettua le chiamate HTTP
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
  public retrieveFeaturesByLayerId(layerId: number): Observable<Feature[]> {

    return this.http.get<Feature[]>(`${this.featureUrl}/${layerId}`);
  }

  /**
   * POST che richiede la creazione di una nuova feature
   * @param item {any} la feature in creazione
   * @returns {Observable<any>} observable della feature in creazione
   */
  public _createFeature(item: any): Observable<any> {
    return this.http.post<any>(`${this.featureUrl}`, item);
  }

  /**
   * PUT che richiede la modifica dei dati di una feature
   * @param item {any} feature modificata
   * @returns {Observable<any>} observable della feature modificata
   */
  public updateFeature(item: any): Observable<any> {
    return this.http.put<any>(`${this.featureUrl}`, item);
  }

  /**
   * DELETE per l'eliminazione di una feature da un layer
   * @param layerId {number} identificativo del layer di appartenenza
   * @param featureId {number} identificativo della feature
   * @returns {Observable<boolean>} observable dell'esito dell'operazione
   */
  public deleteFeature(layerId: number, featureId: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.featureUrl}/${layerId}/${featureId}`);
  }

  /**
   * GET che richiede se la feature di un layer può essere rimossa
   * @param layerId {number} identificativo numerico del layer
   * @param featureId {number} identificativo numerico della feature
   * @returns {Observable<boolean>} observable del booleano che definisce se la feature di un layer può essere cancellata
   */
  public retrieveCanBeDeleted(layerId: number, featureId: number): Observable<boolean> {

    return this.http.get<boolean>(`${this.featureUrl}/canbedeleted/${layerId}/${featureId}`);
  }

  //#region TEXTO

  public createFeature(newFeature: TFeature): Observable<TFeature> {
    const uuid = uuidv4();
    return this.http.post<TFeature>(
      `${this.textoUrl}/texto/feature/create`,
      newFeature,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    );
  }

  public removeFeatureById(featureId: number): Observable<TFeature> {
    const uuid = uuidv4();
    return this.http.get<TFeature>(
      `${this.textoUrl}/texto/feature/${featureId}/remove`,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    );
  }

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
