import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { PaginatedResponse } from '../models/texto/paginated-response';
import { TAnnotation } from '../models/texto/t-annotation';
import { TAnnotationFeature } from '../models/texto/t-annotation-feature';
import { MultipleAnnotationFeature, TextOffset } from '../controllers/editors/multiple-text-annotation-editor/multiple-text-annotation-editor.component';

export class WordAnnotationRequest {
  start!: number;
  end!: number;
  layers: number[] = [];
}

export interface FeatureWordResponse {
  value: string;
  feature_name: string;
  feature_id: number;
}

export interface WordAnnotationResponse {
  annotation_id: number,
  resource_id: number,
  resource_name: string,
  layer_id: number,
  layer_name: string,
  start: number,
  end: number,
  features: FeatureWordResponse[]
}

export interface MultipleAnnotationRequest {
  layerId?: number;
  features?: MultipleAnnotationFeature[];
  offsets?: TextOffset[];
}

export class MultipleAnnotationResponse {
  success: number = 0;
  errors: number[] = [];

  get status(): 'SUCCESS' | 'ERROR' | 'PARTIAL' {
    if (this.success > 0 && this.errors.length > 0) {
      return 'PARTIAL';
    } else if (this.errors.length > 0) {
      return 'ERROR';
    } else {
      return 'SUCCESS';
    }
  }
}

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
  public retrieveTextTotalRows(textId: number): Observable<number> {
    return this.http.get<number>(`${this.textoUrl}/resource/${textId}/rowCount`);
  }

  /**
   * Retrieves the list of annotations associated with a portion of text.
   * @param textId {number} resource identifier
   * @param wordAnnotationRequest {WordAnnotationRequest} coordinates of the set of rows for which we want annotations and optional list of visible layer ids
   * @returns {Observable<WordAnnotationResponse[]>} observable of the annotation list
   */
  public retrieveWordAnnotations(textId: number, wordAnnotationRequest: WordAnnotationRequest): Observable<WordAnnotationResponse[]> {
    return this.http.post<WordAnnotationResponse[]>(`${this.textoUrl}/util/resource/${textId}/word-annotations`, wordAnnotationRequest);
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
   * Create multiple annotations in a single request
   * @param request {MultipleAnnotationRequest} the request containing layerId, features, and offsets
   * @returns {Observable<void>} observable indicating the completion of the operation
   */
  public createMultipleAnnotation(request: MultipleAnnotationRequest): Observable<MultipleAnnotationResponse> {
    return this.http.post<MultipleAnnotationResponse>(
      `${this.textoUrl}/annotation/multiple`,
      request,
    );
  }

  /**
   * Deletes multiple annotations based on the provided request.
   *
   * @param request - The request object containing the details of the annotations to be deleted.
   * @returns An observable that emits the response containing the result of the deletion operation.
   */
  public deleteMultipleAnnotation(request: MultipleAnnotationRequest): Observable<MultipleAnnotationResponse> {
    return this.http.request<MultipleAnnotationResponse>('delete', `${this.textoUrl}/annotation/multiple`, {
      body: request,
    });
  }

  /**
   * Updates multiple annotations based on the provided request.
   *
   * @param request - The request object containing the details of the annotations to be updated.
   * @returns An observable that emits the response containing the result of the update operation.
   */
  public updateMultipleAnnotation(request: MultipleAnnotationRequest): Observable<MultipleAnnotationResponse> {
    return this.http.post<MultipleAnnotationResponse>(`${this.textoUrl}/annotation/multiple-update`, request);
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
