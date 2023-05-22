import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LexiconStatistics } from '../models/lexicon/lexicon-statistics';
import { FormUpdater, LexicalEntryUpdater, LexicalSenseUpdater, LinguisticRelationUpdater } from '../models/lexicon/lexicon-updater';
import { Morphology } from '../models/lexicon/morphology.model';
import { OntolexType } from '../models/lexicon/ontolex-type.model';
import { LexicalEntriesResponse, searchModeEnum } from '../models/lexicon/lexical-entry-request.model';
import { CommonService } from './common.service';
import { FormCore, FormListItem, LexicalEntryCore, MorphologyProperty, SenseCore, SenseListItem } from '../models/lexicon/lexical-entry.model';
import { Namespace } from '../models/lexicon/namespace.model';
import { LinguisticRelationModel } from '../models/lexicon/linguistic-relation.model';

/**Classe dei servizi relativi al lessico */
@Injectable({
  providedIn: 'root'
})
export class LexiconService {

  /**Url per le chiamate relative a LexO */
  private lexoUrl: string;
  /**Chiave per le chiamate in scrittura */
  private writeKey = 'PRINitant19';
  private encodedBaseIRI: string;

  /**
   * Costruttore per LexiconService
   * @param http {HttpClient} effettua le chiamate HTTP
   */
  constructor(
    private http: HttpClient,
    private commonService: CommonService
  ) {
    this.lexoUrl = environment.lexoUrl;
    this.encodedBaseIRI = this.commonService.encodeUrl(environment.rutBaseIRI);
  }

  /**
   * GET che richiede la cancellazione di una forma
   * @param formID {string} instanceName della forma
   * @returns {Observable<string>}
   */
  deleteForm(formID: string): Observable<string> {
    const encodedFormID = this.commonService.encodeUrl(formID);
    return this.http.get(
      `${this.lexoUrl}lexicon/delete/form?id=${encodedFormID}`,
      { responseType: "text" }
    );
  }

  /**
   * GET che richiede la cancellazione di un'entrata lessicale
   * @param lexicalEntryID {string} instance name dell'entrata lessicale
   * @returns {Observable<string>}
   */
  deleteLexicalEntry(lexicalEntryID: string): Observable<string> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntryID);
    return this.http.get(
      `${this.lexoUrl}lexicon/delete/lexicalEntry?id=${encodedLexEntry}`,
      { responseType: "text" }
    );
  }

  /**
   * GET che richiede la cancellazione di un senso
   * @param senseID {string} instance name del senso
   * @returns {Observable<string>}
   */
  deleteLexicalSense(senseID: string) {
    const encodedSenseID = this.commonService.encodeUrl(senseID);
    return this.http.get(
      `${this.lexoUrl}lexicon/delete/lexicalSense?id=${encodedSenseID}`,
      { responseType: "text" }
    );
  }

  /**
   * POST che richiede la cancellazione di una relazione
   * @param lexicalEntityId {string} identificativo dell'entità
   * @param updater {{relation: string, value: string}} dati di aggiornamento
   * @returns {Observable<string>}
   * @example updater = {relation: 'gender', value: 'female'}
   */
  deleteRelation(lexicalEntityId: string, updater: { relation: string, value: string }): Observable<string> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntityId);
    return this.http.post(
      `${this.lexoUrl}lexicon/delete/relation?id=${encodedLexEntry}`,
      updater,
      { responseType: "text" }
    );
  }

  /**
   * POST che recupera la lista delle entrate lessicali eventualmente filtrate
   * @param parameters {any} parametri di filtro della ricerca
   * @returns {Observable<any>} observable della lista delle entrate lessicali
   */
  getLexicalEntriesList(parameters: any): Observable<LexicalEntriesResponse> {
    // MOCK
    //return this.http.get<any>(`assets/mock/lexicon/lexicalentries.json`);
    // FINE MOCK

    return this.http.post<LexicalEntriesResponse>(`${this.lexoUrl}lexicon/data/lexicalEntries`, parameters);
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
    const encodedId = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get(`${this.lexoUrl}lexicon/data/elements?id=${encodedId}`);
  }

  getFilteredLexicalConcepts(parameters: {text: string, searchMode: searchModeEnum, labelType: string, author: string, offset: number, limit: number}): Observable<{totalHits: number, list: any[]}> { //TODO replace con response list corretto
    return this.http.post<{totalHits: number, list: any[]}>(`${this.lexoUrl}lexicon/data/filteredLexicalConcepts`, parameters)
  }

  /**
   * GET che recupera i dati di una forma
   * @param formID {string} identificativo della forma
   * @returns {Observable<any>}
   */
  getForm(formID: string): Observable<FormCore> {
    const encodedFormID = this.commonService.encodeUrl(formID);
    return this.http.get<FormCore>(`${this.lexoUrl}lexicon/data/form?id=${encodedFormID}&aspect=core`);
  }

  /**
   * GET che recupera la lista dei tipi di forma
   * @returns {Observable<OntolexType[]>} observable della lista dei tipi di forma
   */
  getFormTypes(): Observable<OntolexType[]> {
    return this.http.get<OntolexType[]>(`${this.lexoUrl}ontolex/data/formType`)
  }

  /**
   * GET che recupera la lista di lingue disponibili per la selezione
   * @returns {Observable<any>} observable della lista di lingue disponibili
   */
  getLanguages(): Observable<LexiconStatistics[]> {
    return this.http.get<LexiconStatistics[]>(`${this.lexoUrl}lexicon/statistics/languages`);
  }

  /**
   * GET che recupera i dati dell'entrata lessicale
   * @param lexicalEntryId {string} identificativo dell'entrata lessicale
   * @returns {Observable<any>}
   */
  getLexicalEntry(lexicalEntryId: string): Observable<LexicalEntryCore> {
    const encodedId = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<LexicalEntryCore>(`${this.lexoUrl}lexicon/data/lexicalEntry?aspect=core&id=${encodedId}`);
  }

  /**
   * GET della lista di forme di un'entrata lessicale
   * @param lexicalEntryId {any} instance name dell'entrata lessicale
   * @returns {Observable<any>} observable della lista di forme di un'entrata lessicale
   */
  getLexicalEntryForms(lexicalEntryId: string): Observable<FormListItem[]> {
    const encodedId = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<FormListItem[]>(`${this.lexoUrl}lexicon/data/forms?id=${encodedId}`);
  }

  /**
   * GET che recupera la lista di sensi di un'entrata lessicale
   * @param lexicalEntryId {any} instance name dell'entrata lessicale
   * @returns {Observable<any>} observable della lista di sensi di un'entrata lessicale
   */
  getLexicalEntrySenses(lexicalEntryId: string): Observable<SenseListItem[]> {
    const encodedId = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<SenseListItem[]>(`${this.lexoUrl}lexicon/data/senses?id=${encodedId}`);
  }

  /**
   * GET che recupera la lista dei tipi di entrata lessicale
   * @returns {Observable<OntolexType[]>} observable della lista dei tipi di entrata lessicale
   */
  getLexicalEntryTypes(): Observable<OntolexType[]> {
    return this.http.get<OntolexType[]>(`${this.lexoUrl}ontolex/data/lexicalEntryType`);
  }

  getLinguisticRelations(property: string, lexicalEntryId: string): Observable<LinguisticRelationModel[]> {
    const encodedId = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<LinguisticRelationModel[]>(`${this.lexoUrl}/lexicon/data/linguisticRelation?property=${property}&id=${encodedId}`);
  }

  /**
   * GET che recupera la lista dei tratti morfologici
   * @returns {Observable<Morphology[]>} observable della lista dei tratti morfologici
   */
  getMorphology(): Observable<Morphology[]> {
    return this.http.get<Morphology[]>(`${this.lexoUrl}lexinfo/data/morphology`);
  }

  getNamespaces(): Observable<Namespace[]> {
    return this.http.get<Namespace[]>(`${this.lexoUrl}lexicon/statistics/namespaces`);
  }

  /**
   * GET che crea una nuova forma associata a un'entrata lessicale
   * @param lexicalEntryId {string} identificativo dell'entrata lessicale
   * @param creator {string} nome dell'utente creatore
   * @returns {Observable<any>}
   */
  getNewForm(lexicalEntryId: string, creator: string): Observable<FormCore> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<FormCore>(`${this.lexoUrl}lexicon/creation/form?lexicalEntryID=${encodedLexEntry}&author=${creator}&prefix=${environment.rutPrefix}&baseIRI=${this.encodedBaseIRI}`);
  }

  /**
   * GET che crea una nuova entrata lessicale
   * @param creator {string} nome dell'utente creatore
   * @returns {Observable<LexicalEntryCore>}
   */
  getNewLexicalEntry(creator: string): Observable<LexicalEntryCore> {
    return this.http.get<LexicalEntryCore>(`${this.lexoUrl}lexicon/creation/lexicalEntry?author=${creator}&prefix=${environment.rutPrefix}&baseIRI=${this.encodedBaseIRI}`);
  }

  /**
   * GET che crea un nuovo senso associato a un'entrata lessicale
   * @param lexicalEntryId {string} identificativo dell'entrata lessicale
   * @param creator {string} nome dell'utente creatore
   * @returns {Observable<SenseCore>}
   */
  getNewSense(lexicalEntryId: string, creator: string): Observable<SenseCore> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntryId);
    return this.http.get<SenseCore>(`${this.lexoUrl}lexicon/creation/lexicalSense?lexicalEntryID=${encodedLexEntry}&author=${creator}&prefix=${environment.rutPrefix}&baseIRI=${this.encodedBaseIRI}`)
  }

  /**
   * GET che recupera la lista di tipi disponibili per la selezione
   * @returns {Observable<OntolexType[]>} observable della lista di tipi disponibili
   */
  getTypes(): Observable<OntolexType[]> {
    return this.http.get<OntolexType[]>(`${this.lexoUrl}ontolex/data/lexicalEntryType`);
  }

  /**
   * GET che restituisce i dati di un senso
   * @param senseID {string} identificativo del senso
   * @returns {Observable<any>}
   */
  getSense(senseID: string): Observable<SenseCore> {
    const encodedSenseID = this.commonService.encodeUrl(senseID);
    return this.http.get<SenseCore>(`${this.lexoUrl}lexicon/data/lexicalSense?aspect=core&id=${encodedSenseID}`);
  }

  /**
   * GET che recupera la lista di autori disponibili per la selezione
   * @returns {Observable<any>} observable della lista di autori
   */
  getAuthors(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/authors`);
  }

  /**
   * GET che recupera la lista di POS disponibili per la selezione
   * @returns {Observable<any>} observable della lista di POS
   */
  getPos(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/pos`);
  }

  /**
   * GET che recupera la lista di status disponibili per la selezione
   * @returns {Observable<any>} observable della lista di status
   */
  getStatus(): Observable<LexiconStatistics[]> {
    return this.http.get<LexiconStatistics[]>(`${this.lexoUrl}lexicon/statistics/status`);
  }

  /**
   * Servizio che data una lista di tratti morfologici ne restituisce i valori concatenati in una stringa
   * @param morphology {{ [key: string]: string }[]} lista di tratti morfologici
   * @returns {string} concatenazione dei tratti morfologici
   */
  concatenateMorphology(morphology: MorphologyProperty[]): string {
    const values = morphology.map(m => m.value.split('#')[1]);
    return values.join(', ')
  }

  uploadConll(prefix: string, baseIRI: string, author: string, language: string,drop: boolean, file: FormData): Observable<any> {
    const encodedBaseIRI = this.commonService.encodeUrl(baseIRI);
    return this.http.post(
      `${this.lexoUrl}import/conll?prefix=${prefix}&baseIRI=${encodedBaseIRI}&author=${author}&language=${language}&drop=${drop}`,
      file
    )
  }

  /**
   * POST di aggiornamento di un'entrata lessicale
   * @param user {string} nome dell'utente
   * @param lexicalEntryID {string} identificativo dell'entrata lessicale
   * @param updater {LexicalEntryUpdater} dati di aggiornamento
   * @returns {Observable<string>} observable del timestamp di ultima modifica
   */
  updateLexicalEntry(user: string, lexicalEntryID: string, updater: LexicalEntryUpdater): Observable<string> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntryID);
    return this.http.post(
      `${this.lexoUrl}lexicon/update/lexicalEntry?user=${user}&id=${encodedLexEntry}`,
      updater,
      { responseType: "text" }
    );
  }

  /**
   * POST di aggiornamento di una forma
   * @param user {string} nome dell'utente
   * @param lexicalFormID {string} identificativo della forma
   * @param updater {FormUpdater} dati di aggiornamento
   * @returns {Observable<string>} observable del timestamp di ultima modifica
   */
  updateLexicalForm(user: string, lexicalFormID: string, updater: FormUpdater): Observable<string> {
    const encodedLexFormID = this.commonService.encodeUrl(lexicalFormID);
    return this.http.post(
      `${this.lexoUrl}lexicon/update/form?id=${encodedLexFormID}&user=${user}`,
      updater,
      { responseType: "text" }
    );
  }

  /**
   * POST di aggiornamento del senso
   * @param user {string} nome dell'utente
   * @param lexicalSenseID {string} identificativo del senso
   * @param updater {LexicalSenseUpdater} dati di aggiornamento
   * @returns {Observable<string>} observable del timestamp di ultima modifica
   */
  updateLexicalSense(user: string, lexicalSenseID: string, updater: LexicalSenseUpdater) {
    const encodedSenseID = this.commonService.encodeUrl(lexicalSenseID);
    return this.http.post(
      `${this.lexoUrl}lexicon/update/lexicalSense?id=${encodedSenseID}&user=${user}`,
      updater,
      { responseType: "text" }
    );
  }

  /**
   * POST di aggiornamento di una relazione linguistica
   * @param lexicalEntryInstanceName {string} identificativo dell'entrata lessicale
   * @param updater {LinguisticRelationUpdater} dati di aggiornamento
   * @returns {Observable<string>} observable del timestamp di ultima modifica
   */
  updateLinguisticRelation(lexicalEntryID: string, updater: LinguisticRelationUpdater): Observable<string> {
    const encodedLexEntry = this.commonService.encodeUrl(lexicalEntryID);
    return this.http.post(
      `${this.lexoUrl}lexicon/update/linguisticRelation?id=${encodedLexEntry}`,
      updater,
      { responseType: "text" }
    );
  }
}
