import { Injectable } from '@angular/core';
import { SearchRequest } from '../models/search/search-request';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SearchResult } from '../models/search/search-result';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  /**search URL */
  private searchUrl: string;

  /**
   * SearchService constructor
   * @param http {HttpClient} HTTP Calls
   */
  constructor(private http: HttpClient) {
    this.searchUrl = environment.searchUrl;
  }

  search(request: SearchRequest) : Observable<SearchResult> {
    // return this.http.post<SearchResult>(this.searchUrl, request);
    return this.http.get<SearchResult>('assets/mock/search/search1.json'); //FIXME eliminare ed agganciare al servizio backend
  }

  exportAll() {
    return this.http.get(`${this.searchUrl}/exportAll`);
  }

  exportSelected(selectedRowsIndexes: string[]) {
    return this.http.post(`${this.searchUrl}/exportSelected`, selectedRowsIndexes);
  }
}
