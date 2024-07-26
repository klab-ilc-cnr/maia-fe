import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DictionaryEntry } from '../models/dictionary/dictionary-entry.model';
import { DictionarySortingItem } from '../models/dictionary/dictionary-sorting-item.model';
import { EtymologyLanguage } from '../models/dictionary/etymology-language.model';
import { LexicogEntriesRequest } from '../models/dictionary/lexicog-entries-request.model';
import { LexicogEntriesResponse } from '../models/dictionary/lexicog-entries-response.model';
import { LexicographicComponent } from '../models/dictionary/lexicographic-component.model';
import { TextualDocument } from '../models/dictionary/textual-document.model';
import { LinguisticRelationModel } from '../models/lexicon/linguistic-relation.model';
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

  /**
   * HTTP request that associates a lexical entry with a dictionary entry
   * @param dictionaryEntryId {string}
   * @param lexicalEntryId {string}
   * @param position {number}
   * @returns {Observable<Object>}
   */
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

  /**
   * HTTP request that associates a dictionary entry of type see also with another dictionary entry
   * @param dictionaryId {string}
   * @param seeAlsoId {string}
   * @returns {Observable<Object>}
   */
  associateSeeAlsoToDictEntry(dictionaryId: string, seeAlsoId: string) {
    return this.http.post(
      `${this.lexoUrl}/associate/dictionaryEntry/seeAlso`,
      {
        dictionaryId: dictionaryId,
        seeAlsoDictionaryId: seeAlsoId
      }
    );
  }

  /**
   * HTTP request that creates a lexical entry and contextually associates it with a dictionary entry
   * @param lang {string} language code
   * @param label {string} lexical entry label
   * @param pos {string}l
   * @param type {string[]}
   * @param dictionaryId {string} dictionary entry identifier
   * @param position {number} position in the list of components of the dictionary entry
   * @returns {Observable<Object>}
   */
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
   * HTTP request to create/update a dictionary entry note 
   * @param dictionaryId {string} dictionary entry identifier
   * @param author {string} username of the author  
   * @param body {string} text of the note
   * @returns {Observable<Object>}
   */
  createAndUpdateDictionaryNote(dictionaryId: string, author: string, body: string) {
    return this.http.post(
      `${this.lexoUrl}/update/dictionaryEntry/notes?id=${this.commonService.encodeUrl(dictionaryId)}&author=${author}`,
      body
    );
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

  /**
   * Request http to disassociate a dictionary entry of type “See also” from another dictionary entry
   * @param dictionaryId {string} dictionary entry identifier
   * @param seeAlsoId {string} see also dictionary entry identifier
   * @returns {Observable<Object>}
   */
  dissociateSeeAlsoFromDictEntry(dictionaryId: string, seeAlsoId: string) {
    return this.http.post(
      `${this.lexoUrl}/delete/dictionaryEntry/seeAlso`,
      {
        dictionaryId: dictionaryId,
        seeAlsoDictionaryId: seeAlsoId
      }
    );
  }

  /**
 * Request http to retrieve the list of works from an author
 * @returns {Observable<TextualDocument[]>}
 */
  retrieveAuthorDocuments(): Observable<TextualDocument[]> {
    return this.http.get<TextualDocument[]>(`${this.lexoUrl}/dictionary/authorDocuments`);
  }


  /**
   * Http request to retrieve the list of components of an entity (for example, of a dictionary entry)
   * @param parentEntityId {string} parent entity (dictionary entry) identifier
   * @returns {Observable<LexicographicComponent[]>}
   */
  retrieveComponents(parentEntityId: string): Observable<LexicographicComponent[]> {
    return this.http.get<LexicographicComponent[]>(`${this.lexoUrl}/data/lexicographicComponents?id=${this.commonService.encodeUrl(parentEntityId)}`)
  }

  /**
   * Request http to retrieve the list of dictionary entry labels related to a lexical entry
   * @param lexicalEntryID {string} lexical entry identifier
   * @returns {Observable<string[]>}
   */
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
   * Http request to retrieve the list of see also relations of a dictionary entry
   * @param dictionaryId {string} dictionary entry identifier
   * @returns {Observable<LinguisticRelationModel[]>} observable of the list of see also relations
   */
  retrieveDictionarySeeAlso(dictionaryId: string): Observable<LinguisticRelationModel[]> {
    return this.http.get<LinguisticRelationModel[]>(`${this.lexoUrl}/data/dictionaryEntry/seeAlso?id=${this.commonService.encodeUrl(dictionaryId)}`);
  }

  retrieveDictionarySortingItems(dictionaryId: string): Observable<DictionarySortingItem[]> {
    // return this.http.get<DictionarySortingItem[]>(`assets/mock/dictionary/sorting-elements.json`); //MOCKUP
    return this.http.get<DictionarySortingItem[]>(`${this.lexoUrl}/dictionary/sortingTree?id=${this.commonService.encodeUrl(dictionaryId)}`);
  }

  /**
   * Request http to retrieve the list of source languages of the etymon 
   * @returns {Observable<EtymologyLanguage[]>}
   */
  retrieveEtymologyLanguages(): Observable<EtymologyLanguage[]> {
    return this.http.get<EtymologyLanguage[]>(`${this.lexoUrl}/dictionary/etymology/languages`);
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

  /**
   * Request http to retrieve the list of other works
   * @returns {Observable<TextualDocument[]>}
   */
  retrieveOtherWorks(): Observable<TextualDocument[]> {
    return this.http.get<TextualDocument[]>(`${this.lexoUrl}/dictionary/otherDocuments`);
  }

  /**
   * HTTP request to update a dictionary entry label
   * @param dictionaryId {string} dictionary entry identifier
   * @param label {string} new value for the label
   * @returns {Observable<Object>}
   */
  updateDictionaryEntryLabel(dictionaryId: string, label: string) {
    return this.http.post(
      `${this.lexoUrl}/update/dictionaryEntry/label?id=${this.commonService.encodeUrl(dictionaryId)}&author=${this.currentUser.username}`,
      { label: label }
    )
  }

  /**
   * HTTP request to update a dictionary entry status
   * @param dictEntryId {string} dictionary entry identifier
   * @param status {string} new working status
   * @returns {Observable<Object>}
   */
  updateDictionaryEntryStatus(dictEntryId: string, status: string) {
    return this.http.post(
      `${this.lexoUrl}/update/dictionaryEntry/status?id=${this.commonService.encodeUrl(dictEntryId)}&author=${this.currentUser.username}`,
      {
        status: status
      }
    );
  }

  updateDictionarySorting(dictionaryId: string, body: DictionarySortingItem[]) {
    return this.http.post(
      `${this.lexoUrl}/update/lemmaSenseTree?author=${this.currentUser.username}&prefix=${this.prefix}&baseIRI=${this.encodedBaseIRI}&id=${this.commonService.encodeUrl(dictionaryId)}`,
      body
    );
  }
}
