import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TTagset } from '../models/texto/t-tagset';
import { TTagsetItem } from '../models/texto/t-tagset-item';

/**Tagset-related services */
@Injectable({
  providedIn: 'root'
})
export class TagsetService {
  /**Url for texto-related requests */
  private textoUrl: string;

  /**
   * Constructor for TagsetService
   * @param http {HttpClient} Performs HTTP requests
   */
  constructor(private http: HttpClient) {
    this.textoUrl = environment.maiaBeTextoUrl;
  }

  /**
   * POST to add a new tagset
   * @param newTagset {TTagset} new tagset to be added
   * @returns {Observable<TTagset>} observable of the new tagset
   */
  public createTagset(newTagset: TTagset): Observable<TTagset> {
    return this.http.post<TTagset>(
      `${this.textoUrl}/tagset/create`,
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
      `${this.textoUrl}/tagsetItem/create`,
      newTagsetItem
    );
  }
  /**
   * GET to retrieve a tagset by ID
   * @param tagsetId {number} tagset identifier
   * @returns {Observable<TTagset>} observable of the tagset
   */
  public getTagsetById(tagsetId: number): Observable<TTagset> {
    return this.http.get<TTagset>(`${this.textoUrl}/tagset/${tagsetId}`);
  }
  /**
   * GET to retrieve the item of the tagset by tagset ID
   * @param tagsetId {number} tagset identifier
   * @returns {Observable<TTagsetItem[]>} observable of the item list for tagset
   */
  public getTagsetItemsById(tagsetId: number): Observable<TTagsetItem[]> {
    return this.http.get<TTagsetItem[]>(`${this.textoUrl}/tagset/${tagsetId}/items`);
  }
  /**
   * GET to retrieve all the tagsets
   * @returns {Observable<TTagset>} observable of the tagset list
   */
  public getTagsetsList(): Observable<TTagset[]> {
    return this.http.get<TTagset[]>(`${this.textoUrl}/tagset/list`);
  }
  /**
   * Delete tagset by ID
   * @param tagsetId {number} tagset identifier
   * @returns {Observable<TTagset>} observable of the removed tagset
   */
  public removeTagsetById(tagsetId: number): Observable<TTagset> { //TODO CHECK RETURN TYPE
    return this.http.delete<TTagset>(`${this.textoUrl}/tagset/${tagsetId}/remove`);
  }
  /**
   * Delete an item from tagset using tagset ID
   * @param tagsetItemId {number} tagset item identifier
   * @returns {Observable<TTagsetItem>} observable of the item removed from tagset
   */
  public removeTagsetItemById(tagsetItemId: number): Observable<TTagsetItem> { //TODO CHECK RETURN TYPE
    return this.http.delete<TTagsetItem>(`${this.textoUrl}/tagsetItem/${tagsetItemId}/remove`);
  }
  /**
   * POST to update tagset data
   * @param updatedTagset {TTagset} updated tagset data
   * @returns {Observable<TTagset>} observable of the updated tagset
   */
  public updateTagset(updatedTagset: TTagset): Observable<TTagset> {
    return this.http.post<TTagset>(
      `${this.textoUrl}/tagset/${updatedTagset.id}/update`,
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
      `${this.textoUrl}/tagsetItem/${updatedTagsetItem.id}/update`,
      updatedTagsetItem,
    );
  }
}
