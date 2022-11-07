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

  getLexicalEntriesList(parameters: any): Observable<any> {
    // MOCK
    //return this.http.get<any>(`assets/mock/lexicon/lexicalentries.json`);
    // FINE MOCK
    
    return this.http.post(`${this.lexoUrl}lexicon/data/lexicalEntries`, parameters);
  }

  getElements(lexicalEntryId: string): Observable<any> {
    // MOCK
    //return this.http.get<any>(`assets/mock/lexicon/elements.json`);
    // FINE MOCK
    
    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryId}/elements?key=${this.key}`);
  }

  getLexicalEntryForms(lexicalEntryInstanceName: any): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryInstanceName}/forms`);
  }

  getLexicalEntrySenses(lexicalEntryInstanceName: any): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryInstanceName}/senses`);
  }

  getLanguages(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/languages?key=${this.key}`);
  }

  getTypes(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/types?key=${this.key}`);
  }

  getAuthors(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/authors?key=${this.key}`);
  }

  getPos(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/pos?key=${this.key}`);
  }

  getStatus(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/status?key=${this.key}`);
  }
}
