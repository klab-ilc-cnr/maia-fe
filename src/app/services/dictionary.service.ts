import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DictionaryEntry } from '../models/dictionary/dictionary-entry.model';
import { LexicogEntriesRequest } from '../models/dictionary/lexicog-entries-request.model';
import { LexicogEntriesResponse } from '../models/dictionary/lexicog-entries-response.model';
import { LexicographicComponent } from '../models/dictionary/lexicographic-component.model';
import { CommonService } from './common.service';
import { LoggedUserService } from './logged-user.service';

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {
  /**Url for LexO requests */
  private lexoUrl: string;
  private prefix = environment.lexoPrefix;
  private encodedBaseIRI = this.commonService.encodeUrl(environment.lexoBaseIRI);
  private currentUser = this.loggedUserService.currentUser!;

  /**
   * Constructor for DictionaryService
   * @param http {HttClient} Performs HTTP requests
   * @param commonService {CommonService} common-use services
   * @param loggedUserService {LoggedUserService} services related to the logged-in user
   */
  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private loggedUserService: LoggedUserService,
  ) {
    this.lexoUrl = environment.maiaBeLexoUrl;
  }

  /**
   * Inserts a new entry into the dictionary
   * @param lang {string} dictionary language
   * @param label {string} label of the dictionary entry
   * @returns {Observable<DictionaryEntry>} observable of the new dictionary entry
   */
  addDictionaryEntry(lang: string, label: string): Observable<DictionaryEntry> {
    return this.http.post<DictionaryEntry>(
      `${this.lexoUrl}/dictionary/create/entry?author=${this.currentUser.username}&prefix=${this.prefix}&baseIRI=${this.encodedBaseIRI}`,
      {
        lang: lang,
        label: label
      }
    );
  }

  associateLexEntryWithDictionaryEntry(dictionaryEntryId: string, lexicalEntryId: string, position: number) {
    return this.http.post(
      `${this.lexoUrl}/dictionary/associate/entry?author=${this.currentUser.username}&prefix=${this.prefix}&baseIRI=${this.encodedBaseIRI}`,
      {
        dictionaryEntryId: dictionaryEntryId,
        lexicalEntryId: lexicalEntryId,
        position: position
      }
    );
  }

  createAndAssociateLexicalEntry(lang: string, label: string, pos: string, type: string[], dictionaryId: string, position: number) {
    return this.http.post(
      `${this.lexoUrl}/dictionary/createAndAssociate/entry?author=${this.currentUser.username}&prefix=${this.prefix}&baseIRI=${this.encodedBaseIRI}`,
      {
        lang: lang,
        label: label,
        pos: pos,
        type: type,
        dictionaryEntryId: dictionaryId,
        position: position
      }
    );
  }

  retrieveComponents(parentEntityId: string): Observable<LexicographicComponent[]> {
    return this.http.get<LexicographicComponent[]>(`${this.lexoUrl}/data/lexicographicComponents?id=${this.commonService.encodeUrl(parentEntityId)}`)
  }

  /**
   * Requires the list of dictionary entries corresponding to a set of filters
   * @param request {LexicogEntriesRequest} set of indexes and filters 
   * @returns {Observable<LexicogEntriesResponse>} observable of the corresponding occurrences and their total number
   */
  retrieveLexicogEntryList(request: LexicogEntriesRequest): Observable<LexicogEntriesResponse> {
    return this.http.post<LexicogEntriesResponse>(
      `${this.lexoUrl}/data/dictionaryEntries`,
      request
    );
  }
}
