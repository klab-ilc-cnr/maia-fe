import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatestAll, combineLatestWith, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TextChoice as TextChoice } from '../models/tile/text-choice-element.model';
import { TextTileContent } from '../models/tile/text-tile-content.model';
import { Tile } from '../models/tile/tile.model';
import { WorkspaceChoice } from '../models/workspace-choice.model';
import { Workspace } from '../models/workspace.model';
import { combineLatest, of } from 'rxjs';
import { DocumentSystem } from '../models/corpus/document-system';
import { ElementType } from '../models/corpus/element-type';
import { v4 as uuidv4 } from 'uuid';

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

    return this.http.put<boolean>(
      `${this.workspacesUrl}/layout`,
      workspace
    );

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

  // INIZIO CHIAMATE CASH SERVER

  baseUrl = "http://localhost:8443"
  // baseUrl = "https://lari2.ilc.cnr.it/"
  public retrieveCorpus(): Observable<DocumentSystem> {
    let uuid = uuidv4();

    return this.http.get<DocumentSystem>(`${this.baseUrl}/api/getDocumentSystem?requestUUID=${uuid}`);
    //return this.http.get<DocumentSystem>('assets/mock/files.json')
  }

  public uploadFile(element_id: number, file: File): Observable<any> {
    let uuid = uuidv4();

    let formData: FormData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.baseUrl}/api/crud/uploadFile?requestUUID=${uuid}&element-id=${element_id}`, formData);
  }

  public renameElement(element_id: number, rename_string: string, type: ElementType): Observable<any> {
    let uuid = uuidv4();

    let payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id,
      "rename-string": rename_string
    }

    let operationUrl = "renameFolder";

    if (type == ElementType.File) {
      operationUrl = "renameFile";
    }

    return this.http.post<any>(`${this.baseUrl}/api/crud/${operationUrl}`, payload);
  }

  public removeElement(element_id: number, type: ElementType): Observable<any> {
    let uuid = uuidv4();

    let payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id
    }

    let operationUrl = "removeFolder";

    if (type == ElementType.File) {
      operationUrl = "removeFile";
    }

    return this.http.post<any>(`${this.baseUrl}/api/crud/${operationUrl}`, payload);
  }

  public moveElement(element_id: number, target_id: number, type: ElementType): Observable<any> {
    let uuid = uuidv4();

    let realTargetId = target_id;
    // To be able to move to the root it is necessary to change the target id from 0 to 1 (which in the db appears to be the root)
    if (realTargetId == 0) {
      realTargetId = 1;
    }

    let payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id,
      "target-id": realTargetId
    }

    let operationUrl = "moveFolder";

    if (type == ElementType.File) {
      operationUrl = "moveFileTo";
    }

    return this.http.post<any>(`${this.baseUrl}/api/crud/${operationUrl}`, payload);
  }

  public addFolder(element_id: number): Observable<any> {
    let uuid = uuidv4();

    let payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id
    }

    return this.http.post<any>(`${this.baseUrl}/api/crud/addFolder`, payload);
  }
  // FINE CHIAMATE CASH SERVER

}
