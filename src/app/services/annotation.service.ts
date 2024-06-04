import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { PaginatedResponse } from '../models/texto/paginated-response';
import { TAnnotation } from '../models/texto/t-annotation';
import { TAnnotationFeature } from '../models/texto/t-annotation-feature';

/**Class of annotation management services */
@Injectable({
  providedIn: 'root'
})
export class AnnotationService {
  /**Url for http requests to Texto */
  private textoUrl: string;

  /**
   * Costructor for AnnotationService
   * @param http {HttpClient} Performs HTTP requests
   */
  constructor(private http: HttpClient) {
    this.textoUrl = environment.maiaBeTextoUrl;
  }

  /**
   * Retrieves the text of a resource by successive batches
   * @param textId {number} resource identifier
   * @param slice {start: number, end: number|null} coordinates of the sets of characters to be retrieved
   * @returns {Observable<string>} observable of the text as a string
   */
  public retrieveText(textId: number, slice: { start: number, end: number | null }): Observable<string> { //NOTE Currently unused, it was a first approximation of the paginated service
    const uuid = uuidv4();
    return this.http.post(
      `${this.textoUrl}/resource/${textId}/text`,
      slice,
      {
        headers: new HttpHeaders({ 'UUID': uuid }),
        responseType: 'text',
      }
    );
  }

  /**
   * Retrieves the text of a resource by successive batches
   * @param textId {number} resource identifier
   * @param slice {start: number, end: number|null} coordinates of the sets of rows to be retrieved
   * @returns {Observable<PaginatedResponse>} observable of the paginated response 
   */
  public retrieveTextSplitted(textId: number, slice: { start: number, end: number }): Observable<PaginatedResponse> { //NOTE Will change the signature, it will not be list of strings but json
    const uuid = uuidv4();
    return this.http.post<PaginatedResponse>(
      `${this.textoUrl}/util/resource/${textId}/rows`,
      slice,
      {
        headers: new HttpHeaders({ 'UUID': uuid }),
      }
    );
  }

  /**
   * Retrieves the list of annotations associated with a portion of text.
   * @param resourceId {number} resource identifier
   * @param slice {start: number, end: number|null} coordinates of the set of rows for which we want annotations and optional list of visible layer ids
   * @returns {Observable<TAnnotation[]>} observable of the annotation list
   */
  public retrieveResourceAnnotations(resourceId: number, slice: { start: number, end: number, layers?: number[] }): Observable<TAnnotation[]> {
    const uuid = uuidv4();
    return this.http.post<TAnnotation[]>(
      `${this.textoUrl}/util/resource/${resourceId}/annotations`,
      slice,
      {
        headers: new HttpHeaders({ 'UUID': uuid }),
      }
    );
  }

  /**
   * Retrieves the number of rows in a text
   * @param textId {number} resource identifier
   * @returns number of rows
   */
  retrieveTextTotalRows(textId: number) : Observable<number> {
    return this.http.get<number>(`${this.textoUrl}/resource/${textId}/rowCount`);
  }

  /**
   * Create a new text annotation
   * @param annotation {TAnnotation} the new annotation
   * @returns {Observable<TAnnotation>} observable of the new annotation
   */
  public createAnnotation(annotation: TAnnotation): Observable<TAnnotation> {
    return this.http.post<TAnnotation>(
      `${this.textoUrl}/annotation/create`,
      annotation,
    );
  }

  /**
   * Delete an annotation by ID
   * @param annotationId {number} annotation identifier
   * @returns {Observable<Object>}
   */
  public deleteAnnotationById(annotationId: number) {
    return this.http.delete(`${this.textoUrl}/annotation/${annotationId}/remove`);
  }

  /**
   * Creates an object that stores the association between annotation to a text, feature and feature value
   * @param annotationFeature {TAnnotationFeature} the new annotation feature
   * @returns {Observable<TAnnotationFeature>} observable of the new annotation feature
   */
  public createAnnotationFeature(annotationFeature: TAnnotationFeature): Observable<TAnnotationFeature> {
    return this.http.post<TAnnotationFeature>(
      `${this.textoUrl}/annotationFeature/create`,
      annotationFeature,
    );
  }

  /**
   * Retrieves the list of features with assigned value associated with an annotation 
   * @param annotationId {number} annotation identifier
   * @returns {Observable<TAnnotationFeature[]>} observable of the annotation feature list
   */
  public retrieveAnnotationFeaturesById(annotationId: number): Observable<TAnnotationFeature[]> {
    return this.http.get<TAnnotationFeature[]>(`${this.textoUrl}/annotation/${annotationId}/features`);
  }

  /**
   * Update the data of an annotation feature
   * @param annotationFeature {TAnnotationFeature} the modified annotation feature
   * @returns {Observable<TAnnotationFeature>} observable of the annotation feature with updated data
   */
  public updateAnnotationFeature(annotationFeature: TAnnotationFeature): Observable<TAnnotationFeature> {
    return this.http.post<TAnnotationFeature>(
      `${this.textoUrl}/annotationFeature/update`,
      annotationFeature
    );
  }
}
