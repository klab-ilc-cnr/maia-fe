import { CreateFeature } from './../models/feature/create-feature';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Feature } from '../models/feature/feature';

/**Classe dei servizi relativi alle feature */
@Injectable({
  providedIn: 'root'
})
export class FeatureService {

  /**Url per le richieste relative alle feature */
  private featureUrl: string;

  /**
   * Costruttore per FeatureService
   * @param http {HttpClient} effettua le chiamate HTTP
   */
  constructor(private http: HttpClient) {
    this.featureUrl = environment.featureUrl;
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
  public createFeature(item: any): Observable<any> {
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
}
