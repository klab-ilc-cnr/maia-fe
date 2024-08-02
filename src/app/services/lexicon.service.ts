import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, mergeMap, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { FilteredSenseModel } from '../models/lexicon/filtered-sense.model';
import { LexEntityRelationTypeModel } from '../models/lexicon/lexentity-relation-type.model';
import { LexicalConceptsResponse } from '../models/lexicon/lexical-concept-list-item.model';
import { LexicalEntriesResponse, LexicalEntryRequest, searchModeEnum } from '../models/lexicon/lexical-entry-request.model';
import { FormCore, FormListItem, LexicalEntryCore, LexoLanguage, MorphologyProperty, SenseCore, SenseListItem } from '../models/lexicon/lexical-entry.model';
import { IndirectRelationModel, LexicalEntityRelationsResponseModel } from '../models/lexicon/lexical-sense-response.model';
import { LexiconStatistics } from '../models/lexicon/lexicon-statistics';
import { FormUpdater, GenericRelationUpdater, LINGUISTIC_RELATION_TYPE, LexicalEntryUpdater, LexicalSenseUpdater, LinguisticRelationUpdater } from '../models/lexicon/lexicon-updater';
import { LinguisticRelationModel } from '../models/lexicon/linguistic-relation.model';
import { Morphology } from '../models/lexicon/morphology.model';
import { Namespace } from '../models/lexicon/namespace.model';
import { OntolexType } from '../models/lexicon/ontolex-type.model';
import { CommonService } from './common.service';
import { LoggedUserService } from './logged-user.service';

/**Lexicon-related services class */
@Injectable({
  providedIn: 'root'
})
export class LexiconService {

  /**Url for requests related to LexO */
  private lexoUrl: string;
  /**Basic coded IRI for creating new lexicon elements */
  private encodedBaseIRI: string;
  private loggedUserName: string;

  /**
   * Constructor for LexiconService
   * @param http {HttpClient} Performs HTTP requests
   * @param commonService {CommonService} general utility services
   */
  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private userService: LoggedUserService,
  ) {
    this.lexoUrl = environment.maiaBeLexoUrl;
    this.encodedBaseIRI = this.commonService.encodeUrl(environment.lexoBaseIRI);
    this.loggedUserName = this.userService.currentUser?.username || 'unknown';
  }

  associateLexicalConceptToSense(senseId: string, lexicalConceptId: string) {
    return this.http.post(
      `${this.lexoUrl}/associate/lexicalConcept`,
      {
        senseId: senseId,
        conceptId: lexicalConceptId
      }
    );
  }

  createNewLexicalEntry(author: string, language: string, label: string, pos: string, type: string): Observable<LexicalEntryCore> {
    return this.http.post<LexicalEntryCore>(
      `${this.lexoUrl}/lexicon/create/entry?author=${author}&prefix=${environment.lexoPrefix}&baseIRI=${this.encodedBaseIRI}`,
      {
        lang: language,
        label: label,
        pos: pos,
        type: [type]
      }
    );
  }

  /**
   * GET to delete a form
   * @param formID {string} form instanceName
   * @returns {Observable<string>}
   */
  deleteForm(formID: string): Observable<string> {
    const encodedFormID = this.commonService.encodeUrl(formID);
    return this.http.get(
      `${this.lexoUrl}/delete/form?id=${encodedFormID}`,
      { responseType: "text" }
    );
  }

  /**
   * GET to delete a lexical entry
   * @param lexicalEntryID {string} lexical entry instance name
   * @returns {Observable<string>}
   */
  deleteLexicalEntry(lexicalEntryID: string): Observable<string> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntryID);
    return this.http.get(
      `${this.lexoUrl}/delete/lexicalEntry?id=${encodedLexEntry}`,
      { responseType: "text" }
    );
  }

  /**
   * GET to delete a sense
   * @param senseID {string} sense instance name
   * @returns {Observable<string>}
   */
  deleteLexicalSense(senseID: string) {
    const encodedSenseID = this.commonService.encodeUrl(senseID);
    return this.http.get(
      `${this.lexoUrl}/delete/lexicalSense?id=${encodedSenseID}`,
      { responseType: "text" }
    );
  }

  /**
   * POST to delete a relation
   * @param lexicalEntityId {string} lexical entity identifier
   * @param updater {{relation: string, value: string}} update data
   * @returns {Observable<string>}
   * @example updater = {relation: 'gender', value: 'female'}
   */
  deleteRelation(lexicalEntityId: string, updater: { relation: string, value: string }): Observable<string> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntityId);
    return this.http.post(
      `${this.lexoUrl}/delete/relation?id=${encodedLexEntry}`,
      updater,
      { responseType: "text" }
    );
  }
  /**
   * GET to delete a semantic relation
   * @param lexicalEntityId {string} entity uri identifier
   * @returns {Observable<string>}
   */
  deleteLexicoSemanticRelation(lexicalEntityId: string): Observable<string> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntityId);
    return this.http.get(
      `${this.lexoUrl}/delete/lexicoSemanticRelation?id=${encodedLexEntry}`,
      { responseType: "text" }
    );
  }

  dissociateLexicalConceptFromSense(senseId: string, lexicalConceptId: string) {
    return this.http.post(
      `${this.lexoUrl}/dissociate/lexicalConcept`,
      {
        senseId: senseId,
        conceptId: lexicalConceptId
      }
    );
  }

  /**
   * POST which retrieves the list of possibly filtered lexical entries
   * @param parameters {LexicalEntryRequest|undefined} search filter parameters
   * @returns {Observable<LexicalEntriesResponse>} observable of the response containing the lexical entry list
   */
  getLexicalEntriesList(parameters: LexicalEntryRequest | undefined): Observable<LexicalEntriesResponse> {
    return this.http.post<LexicalEntriesResponse>(`${this.lexoUrl}/data/lexicalEntries`, parameters);
  }

  /**
   * GET that retrieves the list of subnodes from the id of a lexical entry
   * @param lexicalEntryId {string} lexical entry identifier
   * @returns {Observable<any>} observable of the list of subnodes
   */
  getElements(lexicalEntryId: string): Observable<any> {
    // MOCK
    //return this.http.get<any>(`assets/mock/lexicon/elements.json`);
    // FINE MOCK
    const encodedId = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get(`${this.lexoUrl}/data/elements?id=${encodedId}`);
  }

  /**
   * POST to retrieve the filtered list of lexical concepts
   * @param parameters {{ text: string, searchMode: searchModeEnum, labelType: string, author: string, offset: number, limit: number }} filter parameters
   * @returns {Observable<{totalHits: number, list: any[]}>} observable of the list of lexical concepts retrieved
   */
  getFilteredLexicalConcepts(parameters: { text: string, searchMode: searchModeEnum, labelType: string, author: string, offset: number, limit: number }): Observable<{ totalHits: number, list: any[] }> { //TODO replace con response list corretto
    return this.http.post<{ totalHits: number, list: any[] }>(`${this.lexoUrl}/data/filteredLexicalConcepts`, parameters)
  }

  /**
   * POST to retrieve the filtered list of senses
   * @param parameters {LexicalEntryRequest} filter parameters
   * @returns {Observable<FilteredSenseModel>} observable containing the number of occurrences and the list of lexical senses retrieved
   */

  getFilteredSenses(parameters: LexicalEntryRequest): Observable<FilteredSenseModel> {
    return <Observable<FilteredSenseModel>>this.http.post(
      `${this.lexoUrl}/data/filteredSenses`,
      parameters,
    );
  }

  /**
   * GET to retrieve the data of a form
   * @param formID {string} form identifier
   * @returns {Observable<FormCore>} form data
   */
  getForm(formID: string): Observable<FormCore> {
    const encodedFormID = this.commonService.encodeUrl(formID);
    return this.http.get<FormCore>(`${this.lexoUrl}/data/form?id=${encodedFormID}&module=core`);
  }

  /**
   * POST to retrieve the list of filtered forms
   * @param parameters {any} filter parameters
   * @returns {Observable<any>} observable of the list of filtered forms
   */
  getFormList(parameters: any): Observable<any> {
    return this.http.post(
      `${this.lexoUrl}/data/filteredForms`,
      parameters
    );
  }

  /**
   * GET to retrieve the list of form types
   * @returns {Observable<OntolexType[]>} observable of the list of form types
   */
  getFormTypes(): Observable<OntolexType[]> {
    return this.http.get<OntolexType[]>(`${this.lexoUrl}/ontolex/data/formType`)
  }

  /**
   * GET to retrieve the list of languages available from statistics
   * @returns {Observable<LexiconStatistics>} observable of the list of languages available from the statistics
   */
  getLanguagesStatistics(): Observable<LexiconStatistics[]> {
    return this.http.get<LexiconStatistics[]>(`${this.lexoUrl}/statistics/lexicon/languages`);
  }

  /**
   * GET to retrieve the list of languages available on LexO
   * @returns {Observable<LexoLanguage[]>} observable of the list of languages available on LexO
   */
  getLanguages(): Observable<LexoLanguage[]> {
    return this.http.get<LexoLanguage[]>(`${this.lexoUrl}/data/languages`);
  }

  /**
   * Retrieve the list of existing lexical concepts
   * @returns {Observable<LexicalConceptsResponse>} observable containing the list of existing lexical concepts
   */
  getLexicalConcepts(type: string): Observable<LexicalConceptsResponse> {
    return this.http.get<LexicalConceptsResponse>(`${this.lexoUrl}/data/lexicalConcepts?type=${type}`);
  }

  getLexicalConceptsBySenseId(senseId: string): Observable<LinguisticRelationModel[]> {
    return this.http.get<LinguisticRelationModel[]>(`${this.lexoUrl}/data/sense/lexicalConcepts?id=${this.commonService.encodeUrl(senseId)}`);
  }

  /**
   * GET to retrieve the list of sense relationship types
   * @returns {Observable<LexEntityRelationTypeModel[]>} observable of the list of types relations of the senses
   */
  getSenseRelationTypes(): Observable<LexEntityRelationTypeModel[]> {
    return this.http.get<LexEntityRelationTypeModel[]>(`${this.lexoUrl}/lexinfo/data/senseRelations`);
  }

  /**
   * GET to retrieve the list of relationship types between lexical entries
   * @returns {Observable<LexEntityRelationTypeModel[]>} observable of the relationship type list
   */
  getLexicalRelationTypes(): Observable<LexEntityRelationTypeModel[]> {
    return this.http.get<LexEntityRelationTypeModel[]>(`${this.lexoUrl}/lexinfo/data/lexicalRelations`);
  }

  /**
   * GET to retrieve lexical entry data
   * @param lexicalEntryId {string} lexical entry identifier
   * @returns {Observable<LexicalEntryCore>} observable of lexical entry data
   */
  getLexicalEntry(lexicalEntryId: string): Observable<LexicalEntryCore> {
    const encodedId = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<LexicalEntryCore>(`${this.lexoUrl}/data/lexicalEntry?module=core&id=${encodedId}`);
  }

  /**
   * GET to retrieve the form list of a lexical entry
   * @param lexicalEntryId {strin} lexical entry instance name
   * @returns {Observable<FormListItem[]>} observable of the list of forms of a lexical entry
   */
  getLexicalEntryForms(lexicalEntryId: string): Observable<FormListItem[]> {
    const encodedId = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<FormListItem[]>(`${this.lexoUrl}/data/forms?id=${encodedId}`);
  }

  /**
   * GET to retrieve the sense list of a lexical entry
   * @param lexicalEntryId {string} lexical entry instance name
   * @returns {Observable<SenseListItem[]>} observable of the list of senses of a lexical entry
   */
  getLexicalEntrySenses(lexicalEntryId: string): Observable<SenseListItem[]> {
    const encodedId = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<SenseListItem[]>(`${this.lexoUrl}/data/senses?id=${encodedId}`);
  }

  /**
   * GET to retrieve the list of lexical entry types
   * @returns {Observable<OntolexType[]>} observable of the list of leical entry types
   */
  getLexicalEntryTypes(): Observable<OntolexType[]> {
    return this.http.get<OntolexType[]>(`${this.lexoUrl}/ontolex/data/lexicalEntryType`);
  }

  /**
   * GET to retrieve the list of linguistic relations of a lexical entry for a given property
   * @param property {string} property whose linguistic relations are desired
   * @param lexicalEntryId {string} lexical entry identifier
   * @returns {Observable<LinguisticRelationModel[]>} observable of the list of linguistic relations
   */
  getLinguisticRelations(property: string, lexicalEntryId: string): Observable<LinguisticRelationModel[]> {
    const encodedId = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<LinguisticRelationModel[]>(`${this.lexoUrl}/data/linguisticRelation?property=${property}&id=${encodedId}`);
  }


  /**
   * GET to retrieve the list of all linguistic relations of a lexical sense
   * @param lexicalSenseId {string} lexical sense identifier
   * @returns {Observable<LinguisticRelationModel[]>} observable of the list of linguistic relations of a lexical sense
   */
  getLexicalSenseRelations(lexicalSenseId: string): Observable<LexicalEntityRelationsResponseModel> {
    const encodedId = this.commonService.encodeUrl(lexicalSenseId);
    return this.http.get<LexicalEntityRelationsResponseModel>(`${this.lexoUrl}/data/lexicalSense?module=variation%20and%20translation&id=${encodedId}`);
  }

  /**
   * GET to retrieve the list of linguistic relations of a lexical entry
   * @param lexicalEntryId {string} lexical entry identifier
   * @returns {Observable<LinguisticRelationModel[]>} observable of the list of linguistic relations of a lexical entry
   */
  getLexicalEntryRelations(lexicalEntryId: string): Observable<LexicalEntityRelationsResponseModel> {
    const encodedId = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<LexicalEntityRelationsResponseModel>(`${this.lexoUrl}/data/lexicalEntry?module=variation%20and%20translation&id=${encodedId}`);
  }

  /**
   * GET to retrieve the list of morphological traits
   * @returns {Observable<Morphology[]>} observable of the list of morphological traits
   */
  getMorphology(): Observable<Morphology[]> {
    return this.http.get<Morphology[]>(`${this.lexoUrl}/lexinfo/data/morphology`);
  }

  /**
   * GET to retrieve the namespace list of the lexicon
   * @returns {Observable<Namespace[]>} observable of the namespace list
   */
  getNamespaces(): Observable<Namespace[]> {
    return this.http.get<Namespace[]>(`${this.lexoUrl}/repository/namespaces`);
  }

  /**
   * GET to add a new form associated with a lexical entry
   * @param lexicalEntryId {string} lexical entry identifier
   * @param creator {string} name of the creator user
   * @returns {Observable<FormCore>} observable of the new form
   */
  getNewForm(lexicalEntryId: string, creator: string): Observable<FormCore> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<FormCore>(`${this.lexoUrl}/create/form?lexicalEntryID=${encodedLexEntry}&author=${creator}&prefix=${environment.lexoPrefix}&baseIRI=${this.encodedBaseIRI}`);
  }

  /**
   * GET to add a new lexical entry
   * @param creator {string} name of the creator user
   * @returns {Observable<LexicalEntryCore>} observable of the new lexical entry
   */
  getNewLexicalEntry(creator: string): Observable<LexicalEntryCore> {
    return this.http.get<LexicalEntryCore>(`${this.lexoUrl}/create/lexicalEntry?author=${creator}&prefix=${environment.lexoPrefix}&baseIRI=${this.encodedBaseIRI}`);
  }

  /**
   * GET to add a new sense associated with a lexical entry
   * @param lexicalEntryId {string} lexical entry identifier
   * @param creator {string} name of the creator user
   * @returns {Observable<SenseCore>} observable of the new sense
   */
  getNewSense(lexicalEntryId: string, creator: string): Observable<SenseCore> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<SenseCore>(`${this.lexoUrl}/create/lexicalSense?lexicalEntryID=${encodedLexEntry}&author=${creator}&prefix=${environment.lexoPrefix}&baseIRI=${this.encodedBaseIRI}`)
  }

  /**
   * GET to retrieve the list of types available for selection
   * @returns {Observable<OntolexType[]>} observable of the list of types
   */
  getTypes(): Observable<OntolexType[]> {
    return this.http.get<OntolexType[]>(`${this.lexoUrl}/ontolex/data/lexicalEntryType`);
  }

  /**
   * GET to retrieve sense data by ID
   * @param senseID {string} sense identifier
   * @returns {Observable<SenseCore>} observable of the sense data
   */
  getSense(senseID: string): Observable<SenseCore> {
    const encodedSenseID = this.commonService.encodeUrl(senseID);
    return this.http.get<SenseCore>(`${this.lexoUrl}/data/lexicalSense?module=core&id=${encodedSenseID}`);
  }

  /**
   * GET to retrieve the list of authors available for selection
   * @returns {Observable<any>} observable of the author list
   */
  getAuthors(): Observable<any> {
    return this.http.get(`${this.lexoUrl}/statistics/lexicon/authors`);
  }

  /**
   * GET to retrieve the list of POS available for selection
   * @returns {Observable<any>} observable of the POS list
   */
  getPos(): Observable<any> {
    return this.http.get(`${this.lexoUrl}/statistics/lexicon/pos`);
  }

  /**
   * GET to retrieve the list of statuses available from statistics
   * @returns {Observable<LexiconStatistics[]>} observable of the status list from statistics
   */
  getStatus(): Observable<LexiconStatistics[]> {
    return this.http.get<LexiconStatistics[]>(`${this.lexoUrl}/statistics/lexicon/status`);
  }

  /**
   * Service that given a list of morphological traits returns their concatenated values in a string
   * @param morphology {MorphologyProperty} list of morphological properties
   * @returns {string} concatenation of morphological traits
   */
  concatenateMorphology(morphology: MorphologyProperty[]): string {
    const values = morphology.map(m => m.value.split('#')[1]);
    return values.join(', ')
  }

  /**
   * POST to load a lexicon from a CoNLL file
   * @param prefix {string} namespace prefix
   * @param baseIRI {string} namespace base iri 
   * @param author {string} author name
   * @param language {string} language of the lexicon in upload
   * @param drop {boolean} defines whether it should be inserted in overwriting
   * @param file {FormData} CoNLL file to upload
   * @returns {Observable<any>} observable of the outcome of the upload
   */
  uploadConll(prefix: string, baseIRI: string, author: string, language: string, drop: boolean, file: FormData): Observable<any> {
    const encodedBaseIRI = this.commonService.encodeUrl(baseIRI);
    return this.http.post(
      `${this.lexoUrl}/import/conll?prefix=${prefix}&baseIRI=${encodedBaseIRI}&author=${author}&language=${language}&drop=${drop}`,
      file
    )
  }

  /**
   * POST to update a generic relation
   * @param lexicalEntryID {string} lexical entry identifier
   * @param updater {GenericRelationUpdater} update information of a generic relation
   * @returns {Observable<string>} observable of last update timestamp
   */
  updateGenericRelation(lexicalEntryID: string, updater: GenericRelationUpdater): Observable<string> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntryID);
    return this.http.post(
      `${this.lexoUrl}/update/genericRelation?id=${encodedLexEntry}`,
      updater,
      { responseType: "text" }
    )
  }

  /**
   * POST to update a lexical entry
   * @param user {string} username
   * @param lexicalEntryID {string} lexical entry identifier
   * @param updater {LexicalEntryUpdater} update data
   * @returns {Observable<string>} observable of last update timestamp
   */
  updateLexicalEntry(user: string, lexicalEntryID: string, updater: LexicalEntryUpdater): Observable<string> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntryID);
    return this.http.post(
      `${this.lexoUrl}/update/lexicalEntry?user=${user}&id=${encodedLexEntry}`,
      updater,
      { responseType: "text" }
    );
  }

  /**
   * POST to update a form
   * @param user {string} username
   * @param lexicalFormID {string} form identifier
   * @param updater {FormUpdater} update data
   * @returns {Observable<string>} observable of last update timestamp
   */
  updateLexicalForm(user: string, lexicalFormID: string, updater: FormUpdater): Observable<string> {
    const encodedLexFormID = this.commonService.encodeUrl(lexicalFormID);
    return this.http.post(
      `${this.lexoUrl}/update/form?id=${encodedLexFormID}&user=${user}`,
      updater,
      { responseType: "text" }
    );
  }

  /**
   * POST to update a sense
   * @param user {string} username
   * @param lexicalSenseID {string} sense identifier
   * @param updater {LexicalSenseUpdater} update data
   * @returns {Observable<string>} observable of last update timestamp
   */
  updateLexicalSense(user: string, lexicalSenseID: string, updater: LexicalSenseUpdater) {
    const encodedSenseID = this.commonService.encodeUrl(lexicalSenseID);
    return this.http.post(
      `${this.lexoUrl}/update/lexicalSense?id=${encodedSenseID}&user=${user}`,
      updater,
      { responseType: "text" }
    );
  }

  /**
   * POST to update a linguistic relation
   * @param lexicalEntityId {string} entity identifier (@example lexical entry or sense)
   * @param updater {LinguisticRelationUpdater} update data
   * @returns {Observable<string>} observable of last update timestamp
   */
  updateLinguisticRelation(lexicalEntityId: string, updater: LinguisticRelationUpdater): Observable<string> {
    const encodedLexEntity = this.commonService.encodeUrl(lexicalEntityId);
    return this.http.post(
      `${this.lexoUrl}/update/linguisticRelation?id=${encodedLexEntity}`,
      updater,
      { responseType: "text" }
    );
  }

  /**
   * Service to create an indirect sense relation
   * @param sourceURI {string} source URI
   * @param categoryURI {string} category URI
   * @param typeURI {string} type URI
   * @returns {Observable<string>}
   */
  createIndirectSenseRelation(sourceURI: string, categoryURI: string, typeURI: string): Observable<string> {

    const createRelationship = (): Observable<IndirectRelationModel> => {
      const createRelationshipUrl = new URL(`${this.lexoUrl}/create/lexicoSemanticRelation`);
      createRelationshipUrl.search = new URLSearchParams({
        id: sourceURI,
        type: typeURI,
        prefix: environment.lexoPrefix,
        baseIRI: environment.lexoBaseIRI,
        author: this.loggedUserName, // FIXME: replace builtin name with real author
      }).toString();

      return <Observable<IndirectRelationModel>>this.http.get(createRelationshipUrl.href, { responseType: 'json' });
    }

    const addCategory = (relationURI: string) => {
      const addCategoryUrl = new URL(`${this.lexoUrl}/update/linguisticRelation`);
      addCategoryUrl.searchParams.append('id', relationURI);
      return this.http.post(addCategoryUrl.href, {
        type: LINGUISTIC_RELATION_TYPE.LEXICOSEMANTIC_REL,
        value: categoryURI,
        relation: 'http://www.w3.org/ns/lemon/vartrans#category',
      }, {
        headers: { 'Content-Type': 'application/json' },
        responseType: 'text',
      }).pipe(mergeMap(() => of(relationURI)));
    }

    return createRelationship().pipe(
      mergeMap(
        (response: IndirectRelationModel) => addCategory(response.relation),
      )
    );
  }
}
