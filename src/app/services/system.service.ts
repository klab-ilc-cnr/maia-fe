import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ActivityStatus } from '../models/activity-status';

/** Services for the operational status of the server (administrators only) */
@Injectable({
  providedIn: 'root'
})
export class SystemService {
  /**Url of maia-be */
  private maiaBeUrl = environment.maiaBeUrl;

  constructor(private http: HttpClient) { }

  /**
   * GET of the recent activity of the server. The answer is never cached by the server (`no-store`).
   * @returns {Observable<ActivityStatus>}
   */
  public getActivity(): Observable<ActivityStatus> {
    return this.http.get<ActivityStatus>(`${this.maiaBeUrl}/system/activity`);
  }
}
