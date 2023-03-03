import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LexiconService {

  private lexoUrl: string;
  private key = "lexodemo"

  constructor(private http: HttpClient) {
    this.lexoUrl = environment.lexoUrl;
  }

  /**
   * POST che recupera la lista delle entrate lessicali eventualmente filtrate
   * @param parameters {any} parametri di filtro della ricerca
   * @returns {Observable<any>} observable della lista delle entrate lessicali
   */
  getLexicalEntriesList(parameters: any): Observable<any> {
    // MOCK
    //return this.http.get<any>(`assets/mock/lexicon/lexicalentries.json`);
    // FINE MOCK
    
    return this.http.post(`${this.lexoUrl}lexicon/data/lexicalEntries`, parameters);
  }

  /**
   * GET che recupera la lista di sottonodi a partire dall'id di un'entrata lessicale
   * @param lexicalEntryId {string} identificativo dell'entrata lessicale
   * @returns {Observable<any>} observable della lista di sottonodi
   */
  getElements(lexicalEntryId: string): Observable<any> {
    // MOCK
    //return this.http.get<any>(`assets/mock/lexicon/elements.json`);
    // FINE MOCK
    
    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryId}/elements?key=${this.key}`);
  }

  /**
   * GET della lista di forme di un'entrata lessicale
   * @param lexicalEntryInstanceName {any} instance name dell'entrata lessicale
   * @returns {Observable<any>} observable della lista di forme di un'entrata lessicale
   */
  getLexicalEntryForms(lexicalEntryInstanceName: any): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryInstanceName}/forms`);
  }

  /**
   * GET che recupera la lista di sensi di un'entrata lessicale
   * @param lexicalEntryInstanceName {any} instance name dell'entrata lessicale
   * @returns {Observable<any>} observable della lista di sensi di un'entrata lessicale
   */
  getLexicalEntrySenses(lexicalEntryInstanceName: any): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryInstanceName}/senses`);
  }

  /**
   * GET che recupera la lista di lingue disponibili per la selezione
   * @returns {Observable<any>} observable della lista di lingue disponibili
   */
  getLanguages(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/languages?key=${this.key}`);
  }

  /**
   * GET che recupera la lista di tipi disponibili per la selezione
   * @returns {Observable<any>} observable della lista di tipi disponibili
   */
  getTypes(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/types?key=${this.key}`);
  }

  /**
   * GET che recupera la lista di autori disponibili per la selezione
   * @returns {Observable<any>} observable della lista di autori
   */
  getAuthors(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/authors?key=${this.key}`);
  }

  /**
   * GET che recupera la lista di POS disponibili per la selezione
   * @returns {Observable<any>} observable della lista di POS
   */
  getPos(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/pos?key=${this.key}`);
  }

  /**
   * GET che recupera la lista di status disponibili per la selezione
   * @returns {Observable<any>} observable della lista di status
   */
  getStatus(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/status?key=${this.key}`);
  }
}
