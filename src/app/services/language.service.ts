import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Language } from '../models/language';

/**Classe dei servizi relativi alle lingue */
@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  /**Url per le chiamate relative alle lingue */
  private languagesUrl: string;

  /**
   * Costruttore per LanguageService
   * @param http {HttpClient} effettua le chiamate HTTP
   */
  constructor(private http: HttpClient) {
    this.languagesUrl = environment.languagesUrl; // recupera l'url dall'environment
  }

  /**
   * GET per il recupero della lista di lingue disponibili
   * @returns {Observable<Language[]>} observable della lista delle lingue disponibili
   */
  public retrieveAll(): Observable<Language[]> {
    return this.http.get<Language[]>(this.languagesUrl);
  }
}
