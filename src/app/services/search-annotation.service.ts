import { Injectable } from '@angular/core';
import { SearchAnnotationRequest } from '../models/search/search-annotation-request';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SearchAnnotationResult } from '../models/search/search-annotation-result';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SearchAnnotationService {

  /**search URL */
  private searchUrl: string;

  /**
   * SearchService constructor
   * @param http {HttpClient} HTTP Calls
   */
  constructor(private http: HttpClient) {
    this.searchUrl = `${environment.maiaBeTextoUrl}/util/aic`;
  }

  searchAnnotation(request: SearchAnnotationRequest): Observable<SearchAnnotationResult> {
    return this.http.post<SearchAnnotationResult>(`${this.searchUrl}`, request);
  }
}
