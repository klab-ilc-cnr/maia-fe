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

  public retrieveById(id: number): Observable<Relation> {
    return this.http.get<Relation>(`${this.relationUrl}/${id}`);
  }
}
