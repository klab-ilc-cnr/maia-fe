import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { TextChoice as TextChoice } from '../models/tile/text-choice-element.model';
import { TextTileContent } from '../models/tile/text-tile-content.model';
import { Tile } from '../models/tile/tile.model';
import { WorkspaceChoice } from '../models/workspace-choice.model';
import { Workspace } from '../models/workspace.model';
import { DocumentSystem } from '../models/corpus/document-system';
import { ElementType, _ElementType } from '../models/corpus/element-type';
import { v4 as uuidv4 } from 'uuid';
import { CorpusElement } from '../models/texto/corpus-element';
import { TextoUser } from '../models/user';

const headers = new HttpHeaders().set('Content-Type', 'application/json'); //TODO verificare rimozione per mancato uso

/**Classe dei servizi per i workspace */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {


  /**Url per chiamate relative ai workspace */
  private workspacesUrl: string;
  /**Url per le chiamate a cash */
  private cashUrl: string;
  private textoUrl: string;
  private textoDebugUrl: string;

  /**
   * Costruttore per WorkspaceService
   * @param http {HttpClient} effettua le chiamate HTTP
   */
  constructor(private http: HttpClient) {
    this.workspacesUrl = environment.workspacesUrl; //inizializzo i due url dall'environment
    this.cashUrl = environment.cashUrl;
    this.textoUrl = environment.textoUrl;
    this.textoDebugUrl = environment.textoDebugUrl;
  }

  //WORKSPACE

  /**
   * PUT che modifica i dati di un workspace di tipo choice
   * @param workspace {WorkspaceChoice} workspace con i dati usati in lista
   * @returns {Observable<WorkspaceChoice>} observable del workspace modificato
   */
  public updateWorkspace(workspace: WorkspaceChoice): Observable<WorkspaceChoice> {
    return this.http.put<WorkspaceChoice>(`${this.workspacesUrl}`, workspace);
  }

  /**
   * DELETE che richiede la rimozione di un workspace
   * @param workspaceId {number} identificativo numerico del workspace
   * @returns {Observable<number>} observable del (id del workspace se elimiato?) //TODO controllare quale valore restituisce
   */
  public deleteWorkspace(workspaceId: number | undefined): Observable<number> {
    return this.http.delete<number>(`${this.workspacesUrl}/${workspaceId}`);
  }

  /**
   * POST di creazione di un nuovo workspace di tipo choice
   * @param workspace {WorkspaceChoice} nuovo workspace di tipo choice
   * @returns {Observable<WorkspaceChoice>} observable del workspace choice (come quelli della lista)
   */
  public createWorkspace(workspace: WorkspaceChoice): Observable<WorkspaceChoice> {
    return this.http.post<WorkspaceChoice>(`${this.workspacesUrl}`, workspace);
  }

  public getWorkspaceName(workspaceId: number) {
    return this.http.get(
      `${this.workspacesUrl}/name/${workspaceId}`,
      { responseType: "text" }
    );
  }

  //TILE

  /**
   * PUT che aggiorna lo stato del workspace in termini di pannelli e tile aperti
   * @param workspaceId {number} identificativo numerico del workspace
   * @param localStorageData {any} dati del workspace e dei suoi pannelli e tile salvati nel localstorage
   * @param openTiles {Map<string, Tile<any>>} mapping dei tile aperti
   * @returns {Observable<boolean>} observable dell'esito (positivo/negativo) del salvataggio
   */
  public saveWorkspaceStatus(workspaceId: number, localStorageData: any, openTiles: Map<string, Tile<any>>): Observable<boolean> {
    const tiles: Array<Tile<any>> = [];
    for (const [tileId, tile] of openTiles.entries()) {
      //tile.tileConfig = JSON.stringify(tile.tileConfig); //passo le configurazioni come stringa

      if (tile.tileConfig.resizeit) //BUG FIX resizeit viene salvato ma non dovrebbe
      {
        delete tile.tileConfig.resizeit;
      }

      const newTile = new Tile(tile.id!, tile.workspaceId!, tile.content, JSON.stringify(tile.tileConfig), tile.type!)
      tiles.push(newTile);
    }

    const workspace = new Workspace(workspaceId, tiles, localStorageData);

    return this.http.put<boolean>(
      `${this.workspacesUrl}/layout`,
      workspace
    );

/*     let layoutSave$ = this.http.put<boolean>(
      `${this.workspacesUrl}/layout`,
      workspace
    );

    return layoutSave$; */

    /*     let tilesSave$ = this.http.post<boolean>(`${this.workspacesUrl}/tiles/${workspaceId}`, tiles);
        return tilesSave$.pipe(combineLatestWith(layoutSave$)); //esegue entrambi i servizi */
  }

  //WORKSPACECHOICE

  /**
   * GET che richiama la lista dei workspace di tipo choice (visualizzati nella tabella)
   * @returns {Observable<Array<WorkspaceChoice>>} onservable della lista dei workspace di tipo choice
   */
  public retrieveWorkspaceChoiceList(): Observable<Array<WorkspaceChoice>> {
    return this.http.get<Array<WorkspaceChoice>>(`${this.workspacesUrl}/workspaceChoiceList`);
  }

  /**
   * GET che recupera i dati relativi a un workspace utilizzando il suo ID
   * @param workspaceId {number} identificativo numerico del workspace
   * @returns {Observable<Workspace>} observable del workspace
   */
  public loadWorkspaceStatus(workspaceId: number): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.workspacesUrl}/status/${workspaceId}`);
  }

  //TEXTCHOICE

  /**
   * GET che richiama la lista di testi selezionabili
   * @returns {Observable<Array<TextChoice>>} observable della lista dei testi come elementi selezionabili
   */
  public retrieveTextChoiceList(): Observable<Array<TextChoice>> {
    return this.http.get<Array<TextChoice>>(`${this.workspacesUrl}/textChoiceList`);
  }

  //TEXT

  /**
   * GET che recupera un tile di testo sulla base del suo ID
   * @param textId {number} identificativo numerico del testo
   * @returns {Observable<TextTileContent>} observable del tile di testo
   */
  public retrieveText(textId: number) {
    return this.http.get<TextTileContent>(`${this.workspacesUrl}/texts/${textId}`);
  }

  // INIZIO CHIAMATE CASH SERVER

  //baseUrl = "http://localhost:8443"
  // baseUrl = "https://lari2.ilc.cnr.it/"
  /**
   * GET che recupera il sistema documentale
   * @returns {Observable<DocumentSystem>} observable del sistema documentale
   */
  public _retrieveCorpus(): Observable<DocumentSystem> {
    const uuid = uuidv4();
//SIM: aggiunto public/ nel path
    return this.http.get<DocumentSystem>(`${this.cashUrl}/api/public/getDocumentSystem?requestUUID=${uuid}`);
    //return this.http.get<DocumentSystem>('assets/mock/files.json')
  }

  public retrieveCorpus(userId?: number): Observable<CorpusElement[]> {
    const uuid = uuidv4();
    const user = userId ? `/${userId}` : '';
    return this.http.get<CorpusElement[]>(
      `${this.textoUrl}/texto/user${user}/tree`,
      {
        headers: new HttpHeaders({'UUID': uuid})
      }
    );
    // return this.http.get(`${this.textoDebugUrl}/texto/user${user}/tree`); //DEBUG
  }

  /**
   * POST che esegue l'upload di un file nel sistema documentale
   * @param element_id {number} identificativo numerico del file
   * @param file {File} il file da caricare
   * @returns {Observable<any>} observable del file caricato nel sistema documentale
   */
  public _uploadFile(element_id: number, file: File): Observable<any> {
    const uuid = uuidv4();

    const formData: FormData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.cashUrl}/api/crud/uploadFile?requestUUID=${uuid}&element-id=${element_id}`, formData);
  }

  public uploadFile(resourceId: number, file: File) {
    const uuid = uuidv4();
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.textoUrl}/texto/resource/${resourceId}/upload`,
      formData,
      {
        headers: new HttpHeaders({'UUID': uuid})
      }
    );
  }

  /**
   * POST che richiede l'aggiornamento del nome dell'elemento documentale
   * @param element_id {number} identificativo numerico dell'elemento documentale
   * @param rename_string {string} nome da dare
   * @param type {_ElementType} tipo di elemento documentale (file o folder)
   * @returns {Observable<any>} observable dell'elemento documentale aggiornato
   */
  public _renameElement(element_id: number, rename_string: string, type: _ElementType): Observable<any> {
    const uuid = uuidv4();

    const payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id,
      "rename-string": rename_string
    }

    let operationUrl = "renameFolder";

    if (type == _ElementType.File) {
      operationUrl = "renameFile";
    }

    return this.http.post<any>(`${this.cashUrl}/api/crud/${operationUrl}`, payload);
  }

  public renameElement(elementType: string, elementId: number, newName: string) {
    const uuid = uuidv4();
    const operationUrl = elementType === ElementType.FOLDER ? 'folder' : 'resource';
    const payload = {
      name: newName
    };
    return this.http.post(
      `${this.textoUrl}/texto/${operationUrl}/${elementId}/update`,
      payload,
      {
        headers: new HttpHeaders({'UUID': uuid})
      }
    );
  }

  /**
   * POST che esegue la cancellazione di file o di una cartella del corpus
   * @param element_id {number} identificativo numerico dell'elemento
   * @param type {_ElementType} tipo di elemento da eliminare
   * @returns {Observable<any>} observable dell'esito della cancellazione
   */
  public _removeElement(element_id: number, type: _ElementType): Observable<any> {
    const uuid = uuidv4();

    const payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id
    }

    let operationUrl = "removeFolder";

    if (type == _ElementType.File) {
      operationUrl = "removeFile";
    }

    return this.http.post<any>(`${this.cashUrl}/api/crud/${operationUrl}`, payload);
  }

  public removeElement(elementType: string, elementId: number) {
    const uuid = uuidv4();
    const operationUrl = elementType === ElementType.FOLDER ? 'folder' : 'resource';
    return this.http.get(
      `${this.textoUrl}/texto/${operationUrl}/${elementId}/remove`,
      {
        headers: new HttpHeaders({'UUID': uuid})
      }
    );
  }

  /**
   * POST che richiede lo spostamento di un elemento documentale
   * @param element_id {number} identificativo numerico dell'elemento
   * @param target_id {number} identificativo numerico del folder di destinazione
   * @param type {_ElementType} tipo di elemento documentale
   * @returns {Observable<any>} observable dell'elemento documentale modificato
   */
  public _moveElement(element_id: number, target_id: number, type: _ElementType): Observable<any> {
    const uuid = uuidv4();

    let realTargetId = target_id;
    // To be able to move to the root it is necessary to change the target id from 0 to 1 (which in the db appears to be the root)
    if (realTargetId == 0) {
      realTargetId = 1;
    }

    const payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id,
      "target-id": realTargetId
    }

    let operationUrl = "moveFolder";

    if (type == _ElementType.File) {
      operationUrl = "moveFileTo";
    }

    return this.http.post<any>(`${this.cashUrl}/api/crud/${operationUrl}`, payload);
  }

  public moveElement(elementType: string, elementId: number, targetId: number) { //TODO sostituire elementType con una enum?
    const uuid = uuidv4();
    const operationUrl = elementType === ElementType.FOLDER ? 'folder' : 'resource';
    const payload = {
      parent: {
        id: targetId
      }
    };
    return this.http.post(
      `${this.textoUrl}/texto/${operationUrl}/${elementId}/update`,
      payload,
      {
        headers: new HttpHeaders({'UUID': uuid})
      }
    );
  }

  /**
   * POST che richiede l'inserimento di una nuova cartella
   * @param element_id {number} identificativo numerico dell'elemento
   * @returns {Observable<any>} observable della nuova cartella inserita
   */
  public _addFolder(element_id: number): Observable<any> {
    const uuid = uuidv4();

    const payload = {
      "uuid": uuid,
      "user-id": 0,
      "element-id": element_id
    }

    return this.http.post<any>(`${this.cashUrl}/api/crud/addFolder`, payload);
  }

  public addFolder(parentFolderId: number, folderName: string, userId: number) {
    const uuid = uuidv4();
    const payload = {
      parent: {
        id: parentFolderId
      },
      name: folderName,
      user: {
        id: userId
      }
    };

    return this.http.post(
      `${this.textoUrl}/texto/folder/create`,
      payload,
      {
        headers: new HttpHeaders({'UUID': uuid})
      }
    )
  }
  // FINE CHIAMATE CASH SERVER

  public getTextoCurrentUserId(): Observable<TextoUser> {
    return this.http.get<TextoUser>(`${this.textoUrl}/texto/user/me`)
  }
}
