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

  /**
   * Http request linking with a sameAs relation one full entry and one referral entry
   * @param referralEntryId {string} referral entry identifier
   * @param fullEntryId {string} full entry identifier
   * @returns {Observable<string>} timestamp
   */
  associateReferralEntry(referralEntryId: string, fullEntryId: string): Observable<string> {
    return this.http.post(
      `${this.lexoUrl}/dictionary/associate/referralEntry`,
      {
        referralEntryId: referralEntryId,
        fullEntryId: fullEntryId
      },
      {
        responseType: 'text'
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

  /**
   * Http request that creates the full entry and the referral entry and links them with a sameAs relationship
   * @param lang {string} dictionary language code
   * @param referralEntryLabel {string} label of the new referral entry
   * @param fullEntryLabel {string} label of the new full entry
   * @returns {Observable<string>} timestamp
   */
  createAndAssociateReferralEntry(lang: string, fullEntryLabel: string, referralEntryLabel: string): Observable<string> {
    return this.http.post(
      `${this.lexoUrl}/dictionary/createAndAssociate/referralEntry?author=${this.currentUser.username}&prefix=${this.prefix}&baseIRI=${this.encodedBaseIRI}`,
      {
        lang: lang,
        fullEntryLabel: fullEntryLabel,
        referralEntryLabel: referralEntryLabel,
      },
      {
        responseType: 'text'
      }
    )
  }

  /**
   * Request http to delete a dictionary entry
   * @param dictionaryEntryId {string} dictionary entry identifier
   * @returns {Observable<string>} timestamp
   */
  deleteDictionaryEntry(dictionaryEntryId: string): Observable<string> {
    return this.http.get(
      `${this.lexoUrl}/delete/dictionaryEntry?id=${this.commonService.encodeUrl(dictionaryEntryId)}`,
      {
        responseType: 'text',
      }
    );
  }

  /**
   * Request http to delete a component
   * @param lexicographicComponentId {string} component identifier
   * @returns {Observable<string>} timestamp
   */
  dissociateComponent(lexicographicComponentId: string) {
    return this.http.get(
      `${this.lexoUrl}/delete/lexicographicComponent?id=${this.commonService.encodeUrl(lexicographicComponentId)}`,
      {
        responseType: 'text'
      }
    );
  }

  retrieveComponents(parentEntityId: string): Observable<LexicographicComponent[]> {
    return this.http.get<LexicographicComponent[]>(`${this.lexoUrl}/data/lexicographicComponents?id=${this.commonService.encodeUrl(parentEntityId)}`)
  }

  retrieveDictionariesByLexicalEntryId(lexicalEntryID: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.lexoUrl}/data/dictionaryEntryByLexicalEntry?id=${this.commonService.encodeUrl(lexicalEntryID)}`);
  }

  /**
   * Request http to retrieve a dictionary entry with all its data
   * @param dictEntryId {string} dictionary entry identifier
   * @returns {Observable<DictionaryEntry>} a complete dictionary entry
   */
  retrieveDictionaryEntryById(dictEntryId: string): Observable<DictionaryEntry> {
    return this.http.get<DictionaryEntry>(`${this.lexoUrl}/data/dictionaryEntry?id=${this.commonService.encodeUrl(dictEntryId)}`)
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
