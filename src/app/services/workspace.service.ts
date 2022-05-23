import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TextChoice as TextChoice } from '../model/text-choice-element.model';
import { TextTileContent } from '../model/text-tile-content.model';
import { Tile } from '../model/tile.model';
import { WorkspaceChoice } from '../model/workspace-choice.model';
import { Workspace } from '../model/workspace.model';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

  private workspacesUrl: string;

  constructor(private http: HttpClient) {
    this.workspacesUrl = environment.workspacesUrl;
  }

  public loadTiles(workspaceId: string): Observable<Workspace>{
    return this.http.get<Workspace>(`${this.workspacesUrl}/tiles/${workspaceId}`);
  }

  public retrieveWorkspaceChoiceList(): Observable<Array<WorkspaceChoice>>{
    return this.http.get<Array<WorkspaceChoice>>(`${this.workspacesUrl}/workspaceChoiceList`);
  }

  public retrieveTextChoiceList(): Observable<Array<TextChoice>> {
    return this.http.get<Array<TextChoice>>(`${this.workspacesUrl}/textChoiceList`);
  }

  public retrieveText(textId: string) {
    return this.http.get<TextTileContent>(`${this.workspacesUrl}/texts/${textId}`);
  }
}
