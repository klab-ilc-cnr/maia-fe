import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LexiconStatistics } from '../models/lexicon/lexicon-statistics';
import { FormUpdater, LexicalEntryUpdater, LexicalSenseUpdater, LinguisticRelationUpdater } from '../models/lexicon/lexicon-updater';
import { Morphology } from '../models/lexicon/morphology.model';
import { OntolexType } from '../models/lexicon/ontolex-type.model';

/**Classe dei servizi relativi al lessico */
@Injectable({
  providedIn: 'root'
})
export class LexiconService {

  /**Url per le chiamate relative a LexO */
  private lexoUrl: string;
  /**Chiave per le chiamate in lettura */
  private readKey = "lexodemo"
  /**Chiave per le chiamate in scrittura */
  private writeKey = 'PRINitant19';

  /**
   * Costruttore per LexiconService
   * @param http {HttpClient} effettua le chiamate HTTP
   */
  constructor(private http: HttpClient) {
    this.lexoUrl = environment.lexoUrl;
  }

  /**
   * GET che richiede la cancellazione di una forma
   * @param formID {string} instanceName della forma
   * @returns {Observable<string>}
   */
  deleteForm(formID: string): Observable<string> {
    return this.http.get(
      `${this.lexoUrl}lexicon/delete/${formID}/form?key=${this.writeKey}`,
      { responseType: "text" }
    );
  }

  /**
   * GET che richiede la cancellazione di un'entrata lessicale
   * @param lexicalEntryID {string} instance name dell'entrata lessicale
   * @returns {Observable<string>}
   */
  deleteLexicalEntry(lexicalEntryID: string): Observable<string> {
    return this.http.get(
      `${this.lexoUrl}lexicon/delete/${lexicalEntryID}/lexicalEntry?key=${this.writeKey}`,
      { responseType: "text" }
    );
  }

  /**
   * GET che richiede la cancellazione di un senso
   * @param senseID {string} instance name del senso
   * @returns {Observable<string>}
   */
  deleteLexicalSense(senseID: string) {
    return this.http.get(
      `${this.lexoUrl}lexicon/delete/${senseID}/lexicalSense?key=${this.writeKey}`,
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
    return this.http.post(
      `${this.lexoUrl}lexicon/delete/${lexicalEntityId}/relation?key=${this.writeKey}`,
      updater,
      { responseType: "text" }
    );
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

    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryId}/elements?key=${this.readKey}`);
  }

  /**
   * GET che recupera i dati di una forma
   * @param formInstanceName {string} identificativo della forma
   * @returns {Observable<any>}
   */
  getForm(formInstanceName: string): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${formInstanceName}/form?key=${this.readKey}&aspect=core`);
  }

  /**
   * GET che recupera la lista dei tipi di forma
   * @returns {Observable<OntolexType[]>} observable della lista dei tipi di forma
   */
  getFormTypes(): Observable<OntolexType[]> {
    return this.http.get<OntolexType[]>(`${this.lexoUrl}ontolex/data/formType`)
  }

  /**
   * GET che recupera i dati dell'entrata lessicale
   * @param lexicalEntryId {string} identificativo dell'entrata lessicale
   * @returns {Observable<any>}
   */
  getLexicalEntry(lexicalEntryId: string): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${lexicalEntryId}/lexicalEntry?key=${this.readKey}&aspect=core`);
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
   * GET che recupera la lista dei tipi di entrata lessicale
   * @returns {Observable<OntolexType[]>} observable della lista dei tipi di entrata lessicale
   */
  getLexicalEntryTypes(): Observable<OntolexType[]> {
    return this.http.get<OntolexType[]>(`${this.lexoUrl}ontolex/data/lexicalEntryType`);
  }

  /**
   * GET che recupera la lista di lingue disponibili per la selezione
   * @returns {Observable<any>} observable della lista di lingue disponibili
   */
  getLanguages(): Observable<LexiconStatistics[]> {
    return this.http.get<LexiconStatistics[]>(`${this.lexoUrl}lexicon/statistics/languages?key=${this.readKey}`);
  }

  /**
   * GET che recupera la lista dei tratti morfologici
   * @returns {Observable<Morphology[]>} observable della lista dei tratti morfologici
   */
  getMorphology(): Observable<Morphology[]> {
    return this.http.get<Morphology[]>(`${this.lexoUrl}lexinfo/data/morphology`);
  }

  /**
   * GET che crea una nuova forma associata a un'entrata lessicale
   * @param lexicalEntryId {string} identificativo dell'entrata lessicale
   * @param creator {string} nome dell'utente creatore
   * @returns {Observable<any>}
   */
  getNewForm(lexicalEntryId: string, creator: string): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/creation/form?lexicalEntryID=${lexicalEntryId}&key=${this.writeKey}&author=${creator}`);
  }

  /**
   * GET che crea una nuova entrata lessicale
   * @param creator {string} nome dell'utente creatore
   * @returns {Observable<any>}
   */
  getNewLexicalEntry(creator: string): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/creation/lexicalEntry?key=${this.writeKey}&author=${creator}`);
  }

  /**
   * GET che crea un nuovo senso associato a un'entrata lessicale
   * @param lexicalEntryId {string} identificativo dell'entrata lessicale
   * @param creator {string} nome dell'utente creatore
   * @returns {Observable<any>}
   */
  getNewSense(lexicalEntryId: string, creator: string): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/creation/lexicalSense?lexicalEntryID=${lexicalEntryId}&key=${this.writeKey}&author=${creator}`)
  }

  /**
   * GET che recupera la lista di tipi disponibili per la selezione
   * @returns {Observable<any>} observable della lista di tipi disponibili
   */
  getTypes(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/types?key=${this.readKey}`);
  }

  /**
   * GET che restituisce i dati di un senso
   * @param senseInstanceName {string} identificativo del senso
   * @returns {Observable<any>}
   */
  getSense(senseInstanceName: string): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/data/${senseInstanceName}/lexicalSense?key=${this.readKey}&aspect=core`);
  }

  /**
   * GET che recupera la lista di autori disponibili per la selezione
   * @returns {Observable<any>} observable della lista di autori
   */
  getAuthors(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/authors?key=${this.readKey}`);
  }

  /**
   * GET che recupera la lista di POS disponibili per la selezione
   * @returns {Observable<any>} observable della lista di POS
   */
  getPos(): Observable<any> {
    return this.http.get(`${this.lexoUrl}lexicon/statistics/pos?key=${this.readKey}`);
  }

  /**
   * GET che recupera la lista di status disponibili per la selezione
   * @returns {Observable<any>} observable della lista di status
   */
  getStatus(): Observable<LexiconStatistics[]> {
    return this.http.get<LexiconStatistics[]>(`${this.lexoUrl}lexicon/statistics/status?key=${this.readKey}`);
  }

  /**
   * Servizio che data una lista di tratti morfologici ne restituisce i valori concatenati in una stringa
   * @param morphology {{ [key: string]: string }[]} lista di tratti morfologici
   * @returns {string} concatenazione dei tratti morfologici
   */
  concatenateMorphology(morphology: { [key: string]: string }[]): string {
    const values = morphology.map(m => m['value']);
    return values.join(',')
  }

  /**
   * POST di aggiornamento di un'entrata lessicale
   * @param user {string} nome dell'utente
   * @param lexicalEntryInstanceName {string} identificativo dell'entrata lessicale
   * @param updater {LexicalEntryUpdater} dati di aggiornamento
   * @returns {Observable<string>} observable del timestamp di ultima modifica
   */
  updateLexicalEntry(user: string, lexicalEntryInstanceName: string, updater: LexicalEntryUpdater): Observable<string> {
    return this.http.post(
      `${this.lexoUrl}lexicon/update/${lexicalEntryInstanceName}/lexicalEntry?key=${this.writeKey}&user=${user}`,
      updater,
      { responseType: "text" }
    );
  }

  /**
   * POST di aggiornamento di una forma
   * @param user {string} nome dell'utente
   * @param lexicalFormInstanceName {string} identificativo della forma
   * @param updater {FormUpdater} dati di aggiornamento
   * @returns {Observable<string>} observable del timestamp di ultima modifica
   */
  updateLexicalForm(user: string, lexicalFormInstanceName: string, updater: FormUpdater): Observable<string> {
    return this.http.post(
      `${this.lexoUrl}lexicon/update/${lexicalFormInstanceName}/form?key=${this.writeKey}&user=${user}`,
      updater,
      { responseType: "text" }
    );
  }

  /**
   * POST di aggiornamento del senso
   * @param user {string} nome dell'utente
   * @param lexicalSenseInstanceName {string} identificativo del senso
   * @param updater {LexicalSenseUpdater} dati di aggiornamento
   * @returns {Observable<string>} observable del timestamp di ultima modifica
   */
  updateLexicalSense(user: string, lexicalSenseInstanceName: string, updater: LexicalSenseUpdater) {
    return this.http.post(
      `${this.lexoUrl}lexicon/update/${lexicalSenseInstanceName}/lexicalSense?key=${this.writeKey}&user=${user}`,
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
  updateLinguisticRelation(lexicalEntryInstanceName: string, updater: LinguisticRelationUpdater): Observable<string> {
    return this.http.post(
      `${this.lexoUrl}lexicon/update/${lexicalEntryInstanceName}/linguisticRelation?key=${this.writeKey}`,
      updater,
      { responseType: "text" }
    );
  }
}
