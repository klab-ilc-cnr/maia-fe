import { Tagset } from './../model/tagset/tagset';
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

  public retrieve(): Observable<Tagset[]> {
    // MOCK
    return this.http.get<Tagset[]>(`assets/mock/tagsets.json`);
    // FINE MOCK

    /* La seguente riga è da DECOMMENTARE dopo aver demockato */
    // return this.http.get<Tagset[]>(this.tagsetUrl);
  }

  public retrieveById(id: number): Observable<Tagset> {
    // MOCK
    return this.http.get<Tagset>(`assets/mock/tagsets/tagset${id}.json`);
    // FINE MOCK

    /* La seguente riga è da DECOMMENTARE dopo aver demockato */
    // return this.http.get<Tagset>(`${this.tagsetUrl}/${id}`);
  }

  public create(item: Tagset) {
    // MOCK
    return this.http.post<Tagset>('assets/mock/tagsets.json', item);
    // FINE MOCK

    /* La seguente riga è da DECOMMENTARE dopo aver demockato */
    // return this.http.post<Tagset>(`${this.tagsetUrl}`, item);
  }

  public update(item: Tagset): Observable<Tagset> {
    return this.http.put<Tagset>(`${this.tagsetUrl}`, item);
  }

  public delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.tagsetUrl}/${id}`);
  }
}
