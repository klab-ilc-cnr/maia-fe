import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TTagset } from '../models/texto/t-tagset';
import { TTagsetItem } from '../models/texto/t-tagset-item';
import { Tagset } from './../models/tagset/tagset';

/**Tagset-related services */
@Injectable({
  providedIn: 'root'
})
export class TagsetService {
  /**Url for tagset-related requests */
  private tagsetUrl: string;
  /**Url for texto-related requests */
  private textoUrl: string;

  /**
   * Constructor for TagsetService
   * @param http {HttpClient} Performs HTTP requests
   */
  constructor(private http: HttpClient) {
    this.tagsetUrl = environment.tagsetUrl; //recupero l'url dall'environment
    this.textoUrl = environment.textoUrl;
  }

  /**
   * GET che recupera l'elenco completo dei tagset
   * @returns {Observable<Tagset[]>} observable della lista di tagset
   */
  public retrieve(): Observable<Tagset[]> { //TODO CHECK TO REMOVE @MPapini91
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
  public retrieveById(id: number): Observable<Tagset> { //TODO CHECK TO REMOVE @MPapini91
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
  public create(item: Tagset) { //TODO CHECK TO REMOVE @MPapini91
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
  public update(item: Tagset): Observable<Tagset> { //TODO CHECK TO REMOVE @MPapini91
    return this.http.put<Tagset>(`${this.tagsetUrl}`, item);
  }

  /**
   * DELETE che richiede la rimozione di un tagset
   * @param id {number} identificativo numerico del tagset
   * @returns {Observable<boolean>} observable dell'esito della rimozione
   */
  public delete(id: number): Observable<boolean> {  //TODO CHECK TO REMOVE @MPapini91
    return this.http.delete<boolean>(`${this.tagsetUrl}/${id}`);
  }

  /**
   * GET che richiede se un tagset è cancellabile
   * @param id {number} identificativo numerico del tagset
   * @returns {Observable<boolean>} observable che definisce se un tagset può essere cancellato o meno
   */
  public retrieveCanBeDeleted(id: number): Observable<boolean> {  //TODO CHECK TO REMOVE @MPapini91
    return this.http.get<boolean>(`${this.tagsetUrl}/canbedeleted/${id}`);
  }

  //#region TEXTO
  /**
   * POST to add a new tagset
   * @param newTagset {TTagset} new tagset to be added
   * @returns {Observable<TTagset>} observable of the new tagset
   */
  public createTagset(newTagset: TTagset): Observable<TTagset> {
    return this.http.post<TTagset>(
      `${this.textoUrl}/texto/tagset/create`,
      newTagset
    );
  }
  /**
   * POST to add a new tagset item (or value)
   * @param newTagsetItem {TTagsetItem} new tagset item to be added
   * @returns {Observable<TTagsetItem>} new tagset item
   */
  public createTagsetItem(newTagsetItem: TTagsetItem): Observable<TTagsetItem> {
    return this.http.post<TTagsetItem>(
      `${this.textoUrl}/texto/tagsetItem/create`,
      newTagsetItem
    );
  }
  /**
   * GET to retrieve a tagset by ID
   * @param tagsetId {number} tagset identifier
   * @returns {Observable<TTagset>} observable of the tagset
   */
  public getTagsetById(tagsetId: number): Observable<TTagset> {
    return this.http.get<TTagset>(`${this.textoUrl}/texto/tagset/${tagsetId}`);
  }
  /**
   * GET to retrieve the item of the tagset by tagset ID
   * @param tagsetId {number} tagset identifier
   * @returns {Observable<TTagsetItem[]>} observable of the item list for tagset
   */
  public getTagsetItemsById(tagsetId: number): Observable<TTagsetItem[]> {
    return this.http.get<TTagsetItem[]>(`${this.textoUrl}/texto/tagset/${tagsetId}/items`);
  }
  /**
   * GET to retrieve all the tagsets
   * @returns {Observable<TTagset>} observable of the tagset list
   */
  public getTagsetsList(): Observable<TTagset[]> {
    return this.http.get<TTagset[]>(`${this.textoUrl}/texto/tagset/list`);
  }
  /**
   * GET to remove a tagset by ID
   * @param tagsetId {number} tagset identifier
   * @returns {Observable<TTagset>} observable of the removed tagset
   */
  public removeTagsetById(tagsetId: number): Observable<TTagset> {
    return this.http.get<TTagset>(`${this.textoUrl}/texto/tagset/${tagsetId}/remove`);
  }
  /**
   * GET to remove an item from tagset using tagset ID
   * @param tagsetItemId {number} tagset item identifier
   * @returns {Observable<TTagsetItem>} observable of the item removed from tagset
   */
  public removeTagsetItemById(tagsetItemId: number): Observable<TTagsetItem> {
    return this.http.get<TTagsetItem>(`${this.textoUrl}/texto/tagsetItem/${tagsetItemId}/remove`);
  }
  /**
   * POST to update tagset data
   * @param updatedTagset {TTagset} updated tagset data
   * @returns {Observable<TTagset>} observable of the updated tagset
   */
  public updateTagset(updatedTagset: TTagset): Observable<TTagset> {
    return this.http.post<TTagset>(
      `${this.textoUrl}/texto/tagset/${updatedTagset.id}/update`,
      updatedTagset,
    );
  }
  /**
   * POST to update an item of a tagset
   * @param updatedTagsetItem {TTagsetItem} updated item data
   * @returns {Observable<TTagsetItem>} Observable of the updated item
   */
  public updateTagsetItem(updatedTagsetItem: TTagsetItem): Observable<TTagsetItem> {
    return this.http.post<TTagsetItem>(
      `${this.textoUrl}/texto/tagsetItem/${updatedTagsetItem.id}/update`,
      updatedTagsetItem,
    );
  }
  //#endregion
}
