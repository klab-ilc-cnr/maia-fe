import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {

  constructor(private http: HttpClient) { }

  // INIZIO CHIAMATE CASH SERVER

  baseUrl = "http://localhost:8443"
  // baseUrl = "https://lari2.ilc.cnr.it/"

  public retrieveByNodeId(nodeId: number): Observable<any> {
    let uuid = "12345678";

    return this.http.get<any>(`${this.baseUrl}/api/v1/annotation?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  public create(nodeId: number, item: any): Observable<any> {
    let uuid = "12345678";

    return this.http.post<any>(`${this.baseUrl}/api/v1/annotation?requestUUID=${uuid}&nodeid=${nodeId}`, item);
  }

  public update(item: any) {
    let uuid = "12345678";

    return this.http.put<any>(`${this.baseUrl}/api/v1/annotation?requestUUID=${uuid}`, item);
  }

  public retrieveTokens(nodeId: number): Observable<any> {
    let uuid = "12345678";

    return this.http.get<any>(`${this.baseUrl}/api/v1/token?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  public retrieveText(nodeId: number): Observable<any> {
    let uuid = "12345678";

    return this.http.get<any>(`${this.baseUrl}/api/v1/gettext?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  public retreiveContent(nodeId: number) {
    let uuid = "12345678";

    return this.http.get<any>(`${this.baseUrl}/api/v1/getcontent?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  public delete(annotationId: number): Observable<any> {
    let uuid = "12345678";

    return this.http.delete<any>(`${this.baseUrl}/api/v1/annotate?requestUUID=${uuid}&annotationID=${annotationId}`);
  }

  // FINE CHIAMATE CASH SERVER

}