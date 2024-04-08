import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LexicogListResponse } from '../models/dictionary/lexicog-list-response.model';

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {

  constructor(
    private http: HttpClient
  ) { }

  retrieveLexicogEntryList(): Observable<LexicogListResponse> {
    return this.http.get<LexicogListResponse>('assets/mock/dictionary/lexicog-entries.json'); //FIXME replace with backend service
  }
}
