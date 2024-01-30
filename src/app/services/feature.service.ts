import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { TFeature } from '../models/texto/t-feature';
/**Class of feature-related services */
@Injectable({
  providedIn: 'root'
})
export class FeatureService {
  /**Url for texto-related requests */
  private textoUrl: string;

  /**
   * Constructor for FeatureService
   * @param http {HttpClient} Performs HTTP requests
   */
  constructor(private http: HttpClient) {
    this.textoUrl = environment.maiaBeTextoUrl;
  }

  /**
   * POST to add a new feature
   * @param newFeature {TFeature} new feature to be added
   * @returns {Observable<TFeature>} new feature added
   */
  public createFeature(newFeature: TFeature): Observable<TFeature> {
    const uuid = uuidv4();
    return this.http.post<TFeature>(
      `${this.textoUrl}/feature/create`,
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
      `${this.textoUrl}/feature/${featureId}/remove`,
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
      `${this.textoUrl}/feature/${updatedFeature.id}/update`,
      updatedFeature,
      { headers: new HttpHeaders({ 'UUID': uuid }) },
    );
  }
}
