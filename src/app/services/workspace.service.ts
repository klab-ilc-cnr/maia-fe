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
  public retrieveCorpus(uuid: string): Observable<CorpusTileContent> {
    // return this.http.get<CorpusTileContent>(`${this.baseUrl}/api/getDocumentSystem?requestUUID=${uuid}`)
    return this.http.get<CorpusTileContent>('assets/mock/files.json')
  }
}
