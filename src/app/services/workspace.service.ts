import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid';
import { ElementType } from '../models/corpus/element-type';
import { CorpusElement, FolderElement, ResourceElement } from '../models/texto/corpus-element';
import { FileUploadType } from '../models/texto/file-upload-type.enum';
import { Section } from '../models/texto/section';
import { TextChoice } from '../models/tile/text-choice-element.model';
import { TextTileContent } from '../models/tile/text-tile-content.model';
import { Tile } from '../models/tile/tile.model';
import { TextoUser } from '../models/user';
import { WorkspaceChoice } from '../models/workspace-choice.model';
import { Workspace } from '../models/workspace.model';

/**Classe dei servizi per i workspace */
@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {

  /**Url per chiamate relative ai workspace */
  private workspacesUrl: string;
  private textoUrl: string;

  /**
   * Costruttore per WorkspaceService
   * @param http {HttpClient} effettua le chiamate HTTP
   */
  constructor(private http: HttpClient) {
    this.workspacesUrl = environment.workspacesUrl; //inizializzo i due url dall'environment
    this.textoUrl = environment.maiaBeTextoUrl;
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

  public retrieveCorpus(userId?: number): Observable<CorpusElement[]> {
    const uuid = uuidv4();
    const user = userId ? `/${userId}` : '';
    return this.http.get<CorpusElement[]>(
      `${this.textoUrl}/user${user}/tree`,
      {
        headers: new HttpHeaders({ 'UUID': uuid })
      }
    );
  }

  /**
   * Executes the http request to load a new file into the corpus
   * @param resourceId {number} resource identifier
   * @param file {File} file to be uploaded
   * @param uploader {FileUploadType} type of uploader needed (marked, plain, etc)
   * @param splitLine {boolean} defines whether to split on new line
   * @returns {Observable<Object>}
   */
  public uploadFile(resourceId: number, file: File, uploader: FileUploadType, splitLine: boolean) {
    const uuid = uuidv4();
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.textoUrl}/resource/${resourceId}/upload?uploader=${uploader}&splitline=${splitLine}`,
      formData,
      {
        headers: new HttpHeaders({ 'UUID': uuid })
      }
    );
  }

  public renameElement(elementType: string, elementId: number, newName: string) {
    const uuid = uuidv4();
    const operationUrl = elementType === ElementType.FOLDER ? 'folder' : 'resource';
    const payload = {
      name: newName
    };
    return this.http.post(
      `${this.textoUrl}/${operationUrl}/${elementId}/update`,
      payload,
      {
        headers: new HttpHeaders({ 'UUID': uuid })
      }
    );
  }

  /**
   * Delete an element from the corpus
   * @param elementType {string} type of the element to be removed (folder or resource)
   * @param elementId {number} element identifier
   * @returns {Observable<Object>}
   */
  public removeElement(elementType: string, elementId: number) {
    const uuid = uuidv4();
    const operationUrl = elementType === ElementType.FOLDER ? 'folder' : 'resource';
    return this.http.delete(
      `${this.textoUrl}/${operationUrl}/${elementId}/remove`,
      {
        headers: new HttpHeaders({ 'UUID': uuid })
      }
    );
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
      `${this.textoUrl}/${operationUrl}/${elementId}/update`,
      payload,
      {
        headers: new HttpHeaders({ 'UUID': uuid })
      }
    );
  }

  public addElement(elementType: ElementType, parentFolderId: number, elementName: string, userId: number): Observable<CorpusElement> {
    const uuid = uuidv4();
    const operationUrl = elementType === ElementType.FOLDER ? 'folder' : 'resource';
    const payload = {
      parent: {
        id: parentFolderId
      },
      name: elementName,
      user: {
        id: userId
      }
    };

    return this.http.post<CorpusElement>(
      `${this.textoUrl}/${operationUrl}/create`,
      payload,
      {
        headers: new HttpHeaders({ 'UUID': uuid })
      }
    )
  }

  public getTextoCurrentUserId(): Observable<TextoUser> {
    return this.http.get<TextoUser>(`${this.textoUrl}/user/me`)
  }

  public getTextoUserRootFolder(userId?: number): Observable<FolderElement> {
    const operationUrl = userId ? `/${userId}` : '';
    return this.http.get<FolderElement>(`${this.textoUrl}/user${operationUrl}/home`);
  }

  public retrieveResourceElementById(resourceId: number): Observable<ResourceElement> {
    return this.http.get<ResourceElement>(`${this.textoUrl}/resource/${resourceId}`);
  }

  /**
   * Retrieve all the sections for a resoruce by Id
   * @param lazy {string} defines whether the tree upload is lazy or not
   */
  public retrieveSectionsByResourceId(resourceId: number, lazy?: string): Observable<Array<Section>> {
    return this.http.get<Array<Section>>(`${this.textoUrl}/util/resource/${resourceId}/sections?lazy=${lazy ? lazy : 'false'}`);
  }
}
