import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AnnotationFeature } from 'src/app/models/annotation/annotation-feature';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { PaginatedResponse } from '../models/texto/paginated-response';
import { TAnnotation } from '../models/texto/t-annotation';
import { TAnnotationFeature } from '../models/texto/t-annotation-feature';

/**Classe dei servizi per le annotazioni */
@Injectable({
  providedIn: 'root'
})
export class AnnotationService {

  /**Url per le chiamate relative alle annotazioni */
  private annotationUrl: string;
  /**Url per le chiamate a cash */
  private cashUrl: string;
  private textoUrl: string;
  /**
   * Costruttore per AnnotationService
   * @param http {HttpClient} effettua le chiamate HTTP
   */
  constructor(private http: HttpClient) {
    this.annotationUrl = environment.annotationUrl;
    this.cashUrl = environment.cashUrl;
    this.textoUrl = environment.textoUrl;
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
    const uuid = uuidv4();
    //SIM: aggiunto public/ e rimosso v1/ per compatibilità con la nuova api di CASH
    return this.http.get<any>(`${this.cashUrl}/api/public/annotation?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  /**
   * POST che effettua la creazione di una nuova annotazione
   * @param nodeId {number} identificativo numerico del file
   * @param item {any} la nuova annotazione
   * @returns {Observable<any>} observable della nuova annotazione
   */
  public create(nodeId: number, item: any): Observable<any> {
    const uuid = uuidv4();
    //SIM: rimosso v1/ per compatibilità con la nuova api di CASH
    return this.http.post<any>(`${this.cashUrl}/api/annotation?requestUUID=${uuid}&nodeid=${nodeId}`, item);
  }

  /**
   * PUT che aggiorna i dati di un'annotazione
   * @param item {any} un'annotazione modificata
   * @returns {Observable<any>} observable dell'annotazione modificata
   */
  public update(item: any) {
    const uuid = uuidv4();
    //SIM: rimosso v1/ per compatibilità con la nuova api di CASH
    return this.http.put<any>(`${this.cashUrl}/api/annotation?requestUUID=${uuid}`, item);
  }

  /**
   * GET che recupera i token dato l'id di un nodo (testuale?) //TODO verificare sullo swagger di cash
   * @param nodeId {number} identificativo numerico
   * @returns {Observable<any>} observable dell'esito
   */
  public retrieveTokens(nodeId: number): Observable<any> {
    const uuid = uuidv4();

    return this.http.get<any>(`${this.cashUrl}/api/v1/token?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  /**
   * GET che recupera un testo sulla base dell'id
   * @param nodeId {identificativo numerico del nodo testo}
   * @returns {Observable<any>} observable del testo
   */
  public _retrieveText(nodeId: number): Observable<any> {
    const uuid = uuidv4();
    //SIM: aggiunto public/ e rimosso v1/ per compatibilità con la nuova api di CASH
    return this.http.get<any>(`${this.cashUrl}/api/public/gettext?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  public retrieveText(textId: number, slice: { start: number, end: number | null }): Observable<string> {
    const uuid = uuidv4();
    return this.http.post(
      `${this.textoUrl}/texto/resource/${textId}/text`,
      slice,
      {
        headers: new HttpHeaders({ 'UUID': uuid }),
        responseType: 'text',
      }
    );
  }

  public retrieveTextSplitted(textId: number, slice: { start: number, end: number }): Observable<PaginatedResponse> { //TODO cambierà la firma, non sarà lista di stringhe ma json
    const uuid = uuidv4();
    return this.http.post<PaginatedResponse>(
      `${this.textoUrl}/texto/resource/${textId}/rows`,
      slice,
      {
        headers: new HttpHeaders({ 'UUID': uuid }),
      }
    );
  }

  public retrieveResourceAnnotations(resourceId: number, slice: { start: number, end: number }): Observable<TAnnotation[]> {
    const uuid = uuidv4();
    return this.http.post<TAnnotation[]>(
      `${this.textoUrl}/texto/resource/${resourceId}/annotations`,
      slice,
      {
        headers: new HttpHeaders({ 'UUID': uuid }),
      }
    );
  }


  /**
   * GET che recupera il contenuto dato l'id di un nodo (testuale?) //TODO verificare sullo swagger di cash
   * @param nodeId {number} identificativo numerico
   * @returns {Observable<any>} observable dell'esito
   */
  public retreiveContent(nodeId: number) {
    const uuid = uuidv4();

    return this.http.get<any>(`${this.cashUrl}/api/v1/getcontent?requestUUID=${uuid}&nodeid=${nodeId}`);
  }

  /**
   * DELETE che esegue la cancellazione di una annotazione sulla base del suo ID
   * @param annotationId {number} identificativo numerico dell'annotazione
   * @returns {Observable<any>} observable dell'esito
   */
  public delete(annotationId: number): Observable<any> {
    const uuid = uuidv4();

    //SIM: rimosso v1/ per compatibilità con la nuova api di CASH
    return this.http.delete<any>(`${this.cashUrl}/api/annotate?requestUUID=${uuid}&annotationID=${annotationId}`);
  }

  // FINE CHIAMATE CASH SERVER

  //INIZIO CHIAMATE NOSTRO BACKEND

  /**
   * POST che effettua la creazione di una nuova feature per un'annotazione
   * @param annFeature {AnnotationFeature} feature dell'annotazione
   * @returns {Observable<any>} observable della nuova feature dell'annotazione
   */
  public _createAnnotationFeature(annFeature: AnnotationFeature): Observable<any> {
    return this.http.post<any>(`${this.annotationUrl}`, annFeature);
  }

  //non necessario al momento
  /*   public updateAnnotationFeature(annFeatures: AnnotationFeature): Observable<AnnotationFeature> {
      return this.http.put<AnnotationFeature>(`${this.annotationUrl}`, annFeatures);
    } */

  /**
   * DELETE che rimuove le feature di una annotazione dato il suo ID
   * @param id {number} identificativo numerico dell'annotazione
   * @returns {Observable<boolean>} observable dell'esito della cancellazione
   */
  public deleteAnnotationFeature(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.annotationUrl}/${id}`);
  }

  //#region TEXTO BACK END

  public createAnnotation(annotation: TAnnotation): Observable<TAnnotation> {
    return this.http.post<TAnnotation>(
      `${this.textoUrl}/texto/annotation/create`,
      annotation,
    );
  }

  public createAnnotationFeature(annotationFeature: TAnnotationFeature): Observable<TAnnotationFeature> {
    return this.http.post<TAnnotationFeature>(
      `${this.textoUrl}/texto/annotationFeature/create`,
      annotationFeature,
    );
  }

  public retrieveAnnotationFeaturesById(annotationId: number): Observable<TAnnotationFeature[]> {
    return this.http.get<TAnnotationFeature[]>(`${this.textoUrl}/texto/annotation/${annotationId}/features`);
  }

  //#endregion
}
