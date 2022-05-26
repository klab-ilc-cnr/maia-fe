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

  public saveWorkspaceStatus(workspaceId: number, localStorageData: any, openTiles: Map<string, Tile<any>>): Observable<[boolean, boolean]> {
    let tiles: Array<Tile<any>> = [];
    for (const [tileId, tile] of openTiles.entries()) {
      //tile.tileConfig = JSON.stringify(tile.tileConfig); //passo le configurazioni come stringa

      let newTile = new Tile(tile.id, tile.workspaceId!, tile.content, JSON.stringify(tile.tileConfig), tile.type!)
      tiles.push(newTile);
    }

    let layoutSave$ = this.http.post<boolean>(
      `${this.workspacesUrl}/tiles/layout/${workspaceId}`,
      localStorageData
    );

    let tilesSave$ = this.http.post<boolean>(`${this.workspacesUrl}/tiles/${workspaceId}`, tiles);

    return tilesSave$.pipe(combineLatestWith(layoutSave$)); //esegue entrambi i servizi
  }

  public loadTiles(workspaceId: number): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.workspacesUrl}/tiles/${workspaceId}`);
  }

  //WORKSPACECHOICE

  public retrieveWorkspaceChoiceList(): Observable<Array<WorkspaceChoice>> {
    return this.http.get<Array<WorkspaceChoice>>(`${this.workspacesUrl}/workspaceChoiceList`);
  }

  //TEXTCHOICE

  public retrieveTextChoiceList(): Observable<Array<TextChoice>> {
    return this.http.get<Array<TextChoice>>(`${this.workspacesUrl}/textChoiceList`);
  }

  //TEXT

  public retrieveText(textId: string) {
    return this.http.get<TextTileContent>(`${this.workspacesUrl}/texts/${textId}`);
  }
}
