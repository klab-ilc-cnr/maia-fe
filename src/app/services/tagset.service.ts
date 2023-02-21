import { Tagset } from './../models/tagset/tagset';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TagsetService {

  private tagsetUrl: string;

  constructor(private http: HttpClient) {
    this.tagsetUrl = environment.tagsetUrl;
  }

  /**
   * GET che recupera l'elenco completo dei tagset
   * @returns {Observable<Tagset[]>} observable della lista di tagset
   */
  public retrieve(): Observable<Tagset[]> {
    // MOCK
    // return this.http.get<Tagset[]>(`assets/mock/tagsets.json`);
    // FINE MOCK

    /* La seguente riga è da DECOMMENTARE dopo aver demockato */
     return this.http.get<Tagset[]>(this.tagsetUrl);
  }

  public retrieveById(id: number): Observable<Tagset> {
    // MOCK
    //return this.http.get<Tagset>(`assets/mock/tagsets/tagset${id}.json`);
    // FINE MOCK

    /* La seguente riga è da DECOMMENTARE dopo aver demockato */
     return this.http.get<Tagset>(`${this.tagsetUrl}/${id}`);
  }

  public create(item: Tagset) {
    // MOCK
    //return this.http.post<Tagset>('assets/mock/tagsets.json', item);
    // FINE MOCK

    /* La seguente riga è da DECOMMENTARE dopo aver demockato */
    return this.http.post<Tagset>(`${this.tagsetUrl}`, item);
  }

  public update(item: Tagset): Observable<Tagset> {
    return this.http.put<Tagset>(`${this.tagsetUrl}`, item);
  }

  public delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.tagsetUrl}/${id}`);
  }

  public retrieveCanBeDeleted(id: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.tagsetUrl}/canbedeleted/${id}`);
  }
}
