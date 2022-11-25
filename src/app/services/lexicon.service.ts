import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { UpdateRelation } from '../models/lexicon/update-lexicon-relation.model';
import { LoggedUserService } from '../services/logged-user.service';

@Injectable({
  providedIn: 'root'
})
export class LexiconService {
  private lexoUrl: string;
  private readKey = "lexodemo";
  private writeKey = "PRINitant19";

  constructor(private http: HttpClient, private loggedUserService: LoggedUserService) {
    this.lexoUrl = environment.lexoUrl;
  }

  getLexicalEntriesList(parameters: any): Observable<any> {
    return this.http.post(`${this.lexoUrl}lexicon/data/lexicalEntries`, parameters);
  }

  updateLexicalEntry(lexicalEntryId: string, updateLexiconRelation: UpdateRelation): Observable<any> {
    let userLabel = `${this.loggedUserService.currentUser?.name} ${this.loggedUserService.currentUser?.surname}<${this.loggedUserService.currentUser?.email}>`

    return this.http.post(
      `${this.lexoUrl}lexicon/update/${lexicalEntryId}/lexicalEntry?key=${this.writeKey}&user=${userLabel}`,
      updateLexiconRelation);
  }

  getLexicalEntry(lexicalEntryId: string): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryId}/lexicalEntry?key=${this.readKey}&aspect=core`)
  }

  getLexicalEntryTypes(): Observable<any> {
    return this.http.get(`${this.lexoUrl}ontolex/data/lexicalEntryType`)
  }

  getLexicalEntriesLanguages(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/languages`)
  }

  getMorphology(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexinfo/data/morphology`)
  }

  getElements(lexicalEntryId: string): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryId}/elements?key=${this.readKey}`);
  }

  getLexicalEntryForms(lexicalEntryInstanceName: any): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryInstanceName}/forms`);
  }

  getForm(formInstanceName: string): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${formInstanceName}/form/?key=${this.readKey}&aspect=core`);
  }

  updateForm(formInstanceName: string, updateRelation: UpdateRelation): Observable<any> {
    let userLabel = `${this.loggedUserService.currentUser?.name} ${this.loggedUserService.currentUser?.surname}<${this.loggedUserService.currentUser?.email}>`

    return this.http.post(
      `${this.lexoUrl}lexicon/update/${formInstanceName}/form?key=${this.writeKey}&user=${userLabel}`,
      updateRelation);
  }

  getLexicalEntrySenses(lexicalEntryInstanceName: any): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryInstanceName}/senses`);
  }

  getSense(senseInstanceName: string): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${senseInstanceName}/lexicalSense/?key=${this.readKey}&aspect=core`);
  }

  updateSense(senseInstanceName: string, updateRelation: UpdateRelation) {
    let userLabel = `${this.loggedUserService.currentUser?.name} ${this.loggedUserService.currentUser?.surname}<${this.loggedUserService.currentUser?.email}>`

    return this.http.post(
      `${this.lexoUrl}lexicon/update/${senseInstanceName}/lexicalSense?key=${this.writeKey}&user=${userLabel}`,
      updateRelation);
  }

  getLanguages(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/languages?key=${this.readKey}`);
  }

  getTypes(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/types?key=${this.readKey}`);
  }

  getAuthors(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/authors?key=${this.readKey}`);
  }

  getPos(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/pos?key=${this.readKey}`);
  }

  getStatus(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/status?key=${this.readKey}`);
  }
}
