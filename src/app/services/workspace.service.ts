import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TextChoiceElement as Text } from '../model/text-choice-element.model';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

  private workspacesUrl: string;

  constructor(private http: HttpClient) {
    this.workspacesUrl = environment.workspacesUrl;
  }

  public retrieveTexts(): Observable<Array<Text>> {
    return this.http.get<Array<Text>>(`${this.workspacesUrl}/texts`);
  }
}
