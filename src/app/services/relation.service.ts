import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Relation } from '../models/relation/relation';

@Injectable({
  providedIn: 'root'
})
export class RelationService {

  private relationUrl: string;

  constructor(private http: HttpClient) {
    this.relationUrl = environment.relationUrl;
  }

  public retrieveByTextId(textId: number): Observable<Relation[]> {
    return this.http.get<Relation[]>(`${this.relationUrl}/${textId}`);
  }

  public create(relation: Relation): Observable<Relation> {
    return this.http.post<Relation>(`${this.relationUrl}`, relation);
  }

  public update(relation: Relation): Observable<Relation> {
    return this.http.put<Relation>(`${this.relationUrl}`, relation);
  }

  public delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.relationUrl}/${id}`);
  }
}
