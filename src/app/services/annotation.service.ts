import { AnnotationFeature } from 'src/app/models/annotation/annotation-feature';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {

  private annotationUrl: string;
  private cashUrl: string;

  constructor(private http: HttpClient) {
    this.annotationUrl = environment.annotationUrl;
    this.cashUrl = environment.cashUrl;
  }

  // INIZIO CHIAMATE CASH SERVER

  //baseUrl = "http://localhost:8443"
  // baseUrl = "https://lari2.ilc.cnr.it/"
  /**
   * GET che recupera le annotazioni dato l'id del nodo
   * @param nodeId {number} identificativo numerico del nodo
   * @returns {Observable<any>} observable delle annotazioni
   */
  public retrieveByNodeId(nodeId: number): Observable<any> {
    let uuid = uuidv4();

    return this.http.get<any>(`${this.cashUrl}/api/v1/annotation?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  public create(nodeId: number, item: any): Observable<any> {
    let uuid = uuidv4();

    return this.http.post<any>(`${this.cashUrl}/api/v1/annotation?requestUUID=${uuid}&nodeid=${nodeId}`, item);
  }

  public update(item: any) {
    let uuid = uuidv4();

    return this.http.put<any>(`${this.cashUrl}/api/v1/annotation?requestUUID=${uuid}`, item);
  }

  public retrieveTokens(nodeId: number): Observable<any> {
    let uuid = uuidv4();

    return this.http.get<any>(`${this.cashUrl}/api/v1/token?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  /**
   * GET che recupera un testo sulla base dell'id
   * @param nodeId {identificativo numerico del nodo testo}
   * @returns {Observable<any>} observable del testo
   */
  public retrieveText(nodeId: number): Observable<any> {
    let uuid = uuidv4();

    return this.http.get<any>(`${this.cashUrl}/api/v1/gettext?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  public retreiveContent(nodeId: number) {
    let uuid = uuidv4();

    return this.http.get<any>(`${this.cashUrl}/api/v1/getcontent?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  public delete(annotationId: number): Observable<any> {
    let uuid = uuidv4();

    return this.http.delete<any>(`${this.cashUrl}/api/v1/annotate?requestUUID=${uuid}&annotationID=${annotationId}`);
  }

  // FINE CHIAMATE CASH SERVER

  //INIZIO CHIAMATE NOSTRO BACKEND

  public createAnnotationFeature(annFeature: AnnotationFeature): Observable<any> {
    return this.http.post<any>(`${this.annotationUrl}`, annFeature);
  }

  //non necessario al momento
/*   public updateAnnotationFeature(annFeatures: AnnotationFeature): Observable<AnnotationFeature> {
    return this.http.put<AnnotationFeature>(`${this.annotationUrl}`, annFeatures);
  } */

  public deleteAnnotationFeature(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.annotationUrl}/${id}`);
  }
}
