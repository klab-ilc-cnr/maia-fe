import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatestAll, combineLatestWith, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TextChoice as TextChoice } from '../model/text-choice-element.model';
import { TextTileContent } from '../model/text-tile-content.model';
import { Tile } from '../model/tile.model';
import { WorkspaceChoice } from '../model/workspace-choice.model';
import { Workspace } from '../model/workspace.model';
import { combineLatest, of } from 'rxjs';
import { CorpusTileContent } from '../model/tileContent/corpus-tile-content';
import { DocumentType } from '../model/tileContent/document-type';

const headers = new HttpHeaders().set('Content-Type', 'application/json');

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {


  private workspacesUrl: string;

  constructor(private http: HttpClient) {
    this.workspacesUrl = environment.workspacesUrl;
  }

  //WORKSPACE

  public updateWorkspace(workspace: WorkspaceChoice): Observable<WorkspaceChoice> {
    return this.http.put<WorkspaceChoice>(`${this.workspacesUrl}`, workspace);
  }

  public deleteWorkspace(workspaceId: number | undefined): Observable<number> {
    return this.http.delete<number>(`${this.workspacesUrl}/${workspaceId}`);
  }

  public createWorkspace(workspace: WorkspaceChoice): Observable<WorkspaceChoice> {
    return this.http.post<WorkspaceChoice>(`${this.workspacesUrl}`, workspace);
  }

  //TILE

  public saveWorkspaceStatus(workspaceId: number, localStorageData: any, openTiles: Map<string, Tile<any>>): Observable<boolean> {
    let tiles: Array<Tile<any>> = [];
    for (const [tileId, tile] of openTiles.entries()) {
      //tile.tileConfig = JSON.stringify(tile.tileConfig); //passo le configurazioni come stringa

      let newTile = new Tile(tile.id!, tile.workspaceId!, tile.content, JSON.stringify(tile.tileConfig), tile.type!)
      tiles.push(newTile);
    }

    let workspace = new Workspace(workspaceId, tiles, localStorageData);

    let layoutSave$ = this.http.put<boolean>(
      `${this.workspacesUrl}/layout`,
      workspace
    );

    return layoutSave$;

    /*     let tilesSave$ = this.http.post<boolean>(`${this.workspacesUrl}/tiles/${workspaceId}`, tiles);
        return tilesSave$.pipe(combineLatestWith(layoutSave$)); //esegue entrambi i servizi */
  }

  //WORKSPACECHOICE

  public retrieveWorkspaceChoiceList(): Observable<Array<WorkspaceChoice>> {
    return this.http.get<Array<WorkspaceChoice>>(`${this.workspacesUrl}/workspaceChoiceList`);
  }

  public loadWorkspaceStatus(workspaceId: number): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.workspacesUrl}/status/${workspaceId}`);
  }

  //TEXTCHOICE

  public retrieveTextChoiceList(): Observable<Array<TextChoice>> {
    return this.http.get<Array<TextChoice>>(`${this.workspacesUrl}/textChoiceList`);
  }

  //TEXT

  public retrieveText(textId: number) {
    return this.http.get<TextTileContent>(`${this.workspacesUrl}/texts/${textId}`);
  }

  //

  baseUrl = "http://localhost:8081"
  // baseUrl = "https://lari2.ilc.cnr.it/"
  public retrieveCorpus(): Observable<CorpusTileContent> {
    let uuid = "12345678"

    return this.http.get<CorpusTileContent>(`${this.baseUrl}/api/getDocumentSystem?requestUUID=${uuid}`)
    //return this.http.get<CorpusTileContent>('assets/mock/files.json')
  }

  public uploadFile(element_id: number, file: File): Observable<any> {
    let uuid = "12345678"

    let formData: FormData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/api/crud/uploadFile?requestUUID=${uuid}&element-id=${element_id}`, formData)
  }

  public renameElement(element_id: number, rename_string: string, type: DocumentType): Observable<any> {
    let uuid = "12345678"

    let payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id,
      "rename-string": rename_string
    }

    let operationUrl = "renameFolder"

    if (type == DocumentType.File) {
      operationUrl = "renameFile"
    }

    return this.http.post<any>(`${this.baseUrl}/api/crud/${operationUrl}`, payload)
  }

  public removeElement(element_id: number, type: DocumentType): Observable<any> {
    let uuid = "12345678"

    let payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id
    }

    let operationUrl = "removeFolder"

    if (type == DocumentType.File) {
      operationUrl = "removeFile"
    }

    return this.http.post<any>(`${this.baseUrl}/api/crud/${operationUrl}`, payload)
  }

  public moveElement(element_id: number, target_id: number, type: DocumentType): Observable<any> {
    let uuid = "12345678"

    let realTargetId = target_id
    console.log(realTargetId)
    // To be able to move to the root it is necessary to change the target id from 0 to 1 (which in the db appears to be the root)
    if (realTargetId == 0) {
      realTargetId = 1
    }

    let payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id,
      "target-id": realTargetId
    }

    let operationUrl = "moveFolder"

    if (type == DocumentType.File) {
      operationUrl = "moveFileTo"
    }

    return this.http.post<any>(`${this.baseUrl}/api/crud/${operationUrl}`, payload)
  }

  public addFolder(element_id: number): Observable<any> {
    let uuid = "12345678"

    let payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id
    }

    return this.http.post<any>(`${this.baseUrl}/api/crud/addFolder`, payload)
  }

}
