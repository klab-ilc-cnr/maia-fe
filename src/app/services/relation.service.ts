import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Relation } from '../models/relation/relation';

/**Classe dei servizi relativi alle relazioni */
@Injectable({
  providedIn: 'root'
})
export class RelationService {

  /**Url per le richieste relative alle relazioni */
  private relationUrl: string;

  /**
   * Costruttore per RelationService
   * @param http {HttpClient} effettua le chiamate HTTP
   */
  constructor(private http: HttpClient) {
    this.relationUrl = environment.relationUrl;
  }

  /**
   * GET che richiede la lista di relazioni associate a un testo
   * @param textId {number} identificativo numerico del testo
   * @returns {Observable<Relation[]>} observable della lista di relazioni
   */
  public retrieveByTextId(textId: number): Observable<Relation[]> {
    return this.http.get<Relation[]>(`${this.relationUrl}/${textId}`);
  }

  /**
   * POST che richiede la creazione di una nuova relazione
   * @param relation {Relation} nuova relazione
   * @returns {Observable<Relation>} observable della nuova relazione inserita
   */
  public create(relation: Relation): Observable<Relation> {
    return this.http.post<Relation>(`${this.relationUrl}`, relation);
  }

  /**
   * PUT che aggiorna i dati di una relazione
   * @param relation {Relation} relazione modificata
   * @returns {Observable<Relation>} observable della relazione modificata
   */
  public update(relation: Relation): Observable<Relation> {
    return this.http.put<Relation>(`${this.relationUrl}`, relation);
  }

  /**
   * DELETE che cancella una relazione identificata dal suo ID
   * @param id {number} identificativo numerico di una relazione
   * @returns {Observable<boolean>} observable dell'esito della richiesta di cancellazione
   */
  public delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.relationUrl}/${id}`);
  }
}
