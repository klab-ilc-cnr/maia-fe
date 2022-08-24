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

  // public retrieveCorpus(): Observable<CorpusTileContent> {
  //   let uuid = "12345678"

  //   return this.http.get<CorpusTileContent>(`${this.baseUrl}/api/getDocumentSystem?requestUUID=${uuid}`)
  //   //return this.http.get<CorpusTileContent>('assets/mock/files.json')
  // }

  public create(nodeId: number, item: any): Observable<any> {
    let uuid = "12345678"

    return this.http.post<any>(`${this.baseUrl}/api/v1/annotation?requestUUID=${uuid}&nodeid=${nodeId}`, item)
  }

  // public renameElement(element_id: number, rename_string: string, type: ElementType): Observable<any> {
  //   let uuid = "12345678"

  //   let payload = {
  //     "uuid": uuid,
  //     "user-id": 0,
  //     "element-id": element_id,
  //     "rename-string": rename_string
  //   }

  //   let operationUrl = "renameFolder"

  //   if (type == ElementType.File) {
  //     operationUrl = "renameFile"
  //   }

  //   return this.http.post<any>(`${this.baseUrl}/api/crud/${operationUrl}`, payload)
  // }

  // public removeElement(element_id: number, type: ElementType): Observable<any> {
  //   let uuid = "12345678"

  //   let payload = {
  //     "uuid": uuid,
  //     "user-id": 0,
  //     "element-id": element_id
  //   }

  //   let operationUrl = "removeFolder"

  //   if (type == ElementType.File) {
  //     operationUrl = "removeFile"
  //   }

  //   return this.http.post<any>(`${this.baseUrl}/api/crud/${operationUrl}`, payload)
  // }

  // public moveElement(element_id: number, target_id: number, type: ElementType): Observable<any> {
  //   let uuid = "12345678"

  //   let realTargetId = target_id
  //   console.log(realTargetId)
  //   // To be able to move to the root it is necessary to change the target id from 0 to 1 (which in the db appears to be the root)
  //   if (realTargetId == 0) {
  //     realTargetId = 1
  //   }

  //   let payload = {
  //     "uuid": uuid,
  //     "user-id": 0,
  //     "element-id": element_id,
  //     "target-id": realTargetId
  //   }

  //   let operationUrl = "moveFolder"

  //   if (type == ElementType.File) {
  //     operationUrl = "moveFileTo"
  //   }

  //   return this.http.post<any>(`${this.baseUrl}/api/crud/${operationUrl}`, payload)
  // }

  // public addFolder(element_id: number): Observable<any> {
  //   let uuid = "12345678"

  //   let payload = {
  //     "uuid": uuid,
  //     "user-id": 0,
  //     "element-id": element_id
  //   }

  //   return this.http.post<any>(`${this.baseUrl}/api/crud/addFolder`, payload)
  // }
  // FINE CHIAMATE CASH SERVER

}
