import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TTagset } from '../models/texto/t-tagset';
import { TTagsetItem } from '../models/texto/t-tagset-item';
import { Tagset } from './../models/tagset/tagset';

/**Classe dei servizi relativi ai tagset */
@Injectable({
  providedIn: 'root'
})
export class TagsetService {

  /**
   * @private
   * Url per le chiamate relative ai tagset
   */
  private tagsetUrl: string;
  private textoUrl: string;

  /**
   * Costruttore per TagsetService
   * @param http {HttpClient} effettua le chiamate HTTP
   */
  constructor(private http: HttpClient) {
    this.tagsetUrl = environment.tagsetUrl; //recupero l'url dall'environment
    this.textoUrl = environment.textoUrl;
  }

  /**
   * GET che recupera l'elenco completo dei tagset
   * @returns {Observable<Tagset[]>} observable della lista di tagset
   */
  public retrieve(): Observable<Tagset[]> {
    // MOCK
    // return this.http.get<Tagset[]>(`assets/mock/tagsets.json`);
    // FINE MOCK

    /* La seguente riga è da DECOMMENTARE dopo aver demockato */
    return this.http.get<Tagset[]>(this.tagsetUrl);
  }

  /**
   * GET che recupera un dato tagset attraverso l'id
   * @param id {number} identificativo numerico del tagset
   * @returns {Observable<Tagset>} observable del tagset recuperato
   */
  public retrieveById(id: number): Observable<Tagset> {
    // MOCK
    //return this.http.get<Tagset>(`assets/mock/tagsets/tagset${id}.json`);
    // FINE MOCK

    /* La seguente riga è da DECOMMENTARE dopo aver demockato */
    return this.http.get<Tagset>(`${this.tagsetUrl}/${id}`);
  }

  /**
   * POST che richiede la creazione di un nuovo tagset
   * @param item {Tagset} tagset da inserire
   * @returns {Observable<Tagset>} observable del nuovo tagset
   */
  public create(item: Tagset) {
    // MOCK
    //return this.http.post<Tagset>('assets/mock/tagsets.json', item);
    // FINE MOCK

    /* La seguente riga è da DECOMMENTARE dopo aver demockato */
    return this.http.post<Tagset>(`${this.tagsetUrl}`, item);
  }

  /**
   * PUT che aggiorna i dati del tagset
   * @param item {Tagset} tagset modificato
   * @returns {Observable<Tagset>} observable del tagset modificato
   */
  public update(item: Tagset): Observable<Tagset> {
    return this.http.put<Tagset>(`${this.tagsetUrl}`, item);
  }

  /**
   * DELETE che richiede la rimozione di un tagset
   * @param id {number} identificativo numerico del tagset
   * @returns {Observable<boolean>} observable dell'esito della rimozione
   */
  public delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.tagsetUrl}/${id}`);
  }

  /**
   * GET che richiede se un tagset è cancellabile
   * @param id {number} identificativo numerico del tagset
   * @returns {Observable<boolean>} observable che definisce se un tagset può essere cancellato o meno
   */
  public retrieveCanBeDeleted(id: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.tagsetUrl}/canbedeleted/${id}`);
  }

  //#region TEXTO
  public createTagset(newTagset: TTagset): Observable<TTagset> {
    return this.http.post<TTagset>(
      `${this.textoUrl}/texto/tagset/create`,
      newTagset
    );
  }

  public createTagsetItem(newTagsetItem: TTagsetItem): Observable<TTagsetItem> {
    return this.http.post<TTagsetItem>(
      `${this.textoUrl}/texto/tagsetItem/create`,
      newTagsetItem
    );
  }

  public getTagsetById(tagsetId: number): Observable<TTagset> {
    return this.http.get<TTagset>(`${this.textoUrl}/texto/tagset/${tagsetId}`);
  }

  public getTagsetItemsById(tagsetId: number): Observable<TTagsetItem[]> {
    return this.http.get<TTagsetItem[]>(`${this.textoUrl}/texto/tagset/${tagsetId}/items`);
  }

  public getTagsetsList(): Observable<TTagset[]> {
    return this.http.get<TTagset[]>(`${this.textoUrl}/texto/tagset/list`);
  }

  public removeTagsetById(tagsetId: number) {
    return this.http.get<TTagset>(`${this.textoUrl}/texto/tagset/${tagsetId}/remove`);
  }

  public removeTagsetItemById(tagsetItemId: number) {
    return this.http.get<TTagsetItem>(`${this.textoUrl}/texto/tagsetItem/${tagsetItemId}/remove`);
  }

  public updateTagset(updatedTagset: TTagset): Observable<TTagset> {
    return this.http.post<TTagset>(
      `${this.textoUrl}/texto/tagset/${updatedTagset.id}/update`,
      updatedTagset,
    );
  }

  public updateTagsetItem(updatedTagsetItem: TTagsetItem): Observable<TTagsetItem> {
    return this.http.post<TTagsetItem>(
      `${this.textoUrl}/texto/tagsetItem/${updatedTagsetItem.id}/update`,
      updatedTagsetItem,
    );
  }
  //#endregion
}
