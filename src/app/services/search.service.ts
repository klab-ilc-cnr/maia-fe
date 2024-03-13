import { Injectable } from '@angular/core';
import { SearchRequest } from '../models/search/search-request';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SearchResult } from '../models/search/search-result';

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

  search(request: SearchRequest) {
    return this.http.post<SearchResult>(this.searchUrl, request);
  }
}
