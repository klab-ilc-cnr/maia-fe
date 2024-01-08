import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Language } from '../models/language';

/**Language-related services class */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  /**Url for language-related calls */
  private languagesUrl: string;

  /**
   * Constructor for LanguageService
   * @param http {HttpClient} Performs HTTP requests
   */
  constructor(private http: HttpClient) {
    this.languagesUrl = environment.languagesUrl; // recupera l'url dall'environment
  }

  /**
   * GET to retrieve the list of available languages
   * @returns {Observable<Language[]>} observable of the list of available languages
   */
  public retrieveAll(): Observable<Language[]> {
    return this.http.get<Language[]>(this.languagesUrl);
  }
}
