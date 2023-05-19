import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { ContextMenu } from 'primeng/contextmenu';
import { DocumentElement } from 'src/app/models/corpus/document-element';
import { ElementType, _ElementType } from 'src/app/models/corpus/element-type';
import { Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MenuItem, MessageService, TreeNode } from 'primeng/api';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import Swal from 'sweetalert2';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { LoaderService } from 'src/app/services/loader.service';
import { Roles } from 'src/app/models/roles';
import { Observable, of, switchMap } from 'rxjs';
import { CorpusElement } from 'src/app/models/texto/corpus-element';
import { FolderElement } from 'src/app/models/texto/corpus-element';
import { CorpusStateService } from 'src/app/services/corpus-state.service';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

/**Variabile globale (jQuery?) */
declare let $: any;

/**Componente del pannello di esplorazione corpus */
@Component({
  selector: 'app-workspace-corpus-explorer',
  templateUrl: './workspace-corpus-explorer.component.html',
  styleUrls: ['./workspace-corpus-explorer.component.scss'],
  providers: [CorpusStateService]
})
export class WorkspaceCorpusExplorerComponent implements OnInit {
  files$ = this.corpusStateService.filesystem$.pipe(
    switchMap(docs => of(this.mapToTreeNodes(docs))),
  );

  folders$!: Observable<TreeNode<CorpusElement>[]>;

  //#region VARIABILI DI VISUALIZZAZIONE DEI MODALI
  visibleAddFolder = false;
  visibleRename = false;
  visibleMove = false;
  visibleUploadFile = false;
  //#endregion

  /**
   * @private
   * Effettua la cancellazione di un elemento
   * @param id {number} identificativo numerico dell'elemento
   * @param name {string} nome dell'elemento
   * @param type {_ElementType} tipo di elemento (cartella o file)
   */
  private deleteElement = (id: number, name: string, type: _ElementType): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare la cartella \'' + name + '\'';
    let successMsg = 'Cartella \'' + name + '\' eliminata con successo';

    if (type == _ElementType.File) {
      errorMsg = 'Errore nell\'eliminare il file \'' + name + '\'';
      successMsg = 'File \'' + name + '\' eliminato con successo';
    }

    this.workspaceService
      ._removeElement(id, type)
      .subscribe({
        next: (result) => {
          if (result.responseStatus == 0) {
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
            Swal.close();
          }
          else if (result.responseStatus == 1) {
            this.showOperationFailed('Utente non autorizzato');
          }
          else {
            this.showOperationFailed(errorMsg);
          }

          this.updateDocumentSystem();
        },
        error: () => {
          this.showOperationFailed('Cancellazione Fallita: ' + errorMsg);
        }
      })
  }

  /**Evento di selezione di un testo */
  @Output() onTextSelectEvent = new EventEmitter<any>();

  /**
   * @private
   * Conteggio dei click
   */
  private clickCount = 0;

  /**Getter che definisce se debba essere visualizzata l'opzione di cancellazione */
  public get shouldDeleteBeDisplayed(): boolean {
    return this.loggedUserService.currentUser?.role == Roles.AMMINISTRATORE; //hanno diritto di cancellazione solo i ruoli amministratore
  }

  /**Getter che definisce se debba essere disabilitato il rinomina */
  public get shouldRMBeDisabled(): boolean {
    if (this.selectedDocument) {
      if (this.selectedDocument.label == "Corpus") { //vero se è selezionata la cartella Corpus
        return true;
      }
      else {
        return false;
      }
    }
    return true; //vero se non è selezionato un file
  }

  /**Getter che definisce se debba essere disabilitato il caricamento di un file */
  public get shouldUploadFileBeDisabled(): boolean {
    if (this.selectedDocument) {
      if (this.selectedDocument.label == "Corpus") {
        return true;
      }
      else {
        return false;
      }
    }
    return false;
  }

  /**Lista dei nodi documentali */
  files: TreeNode<DocumentElement>[] = [];
  /**File caricato */
  fileUploaded: File|undefined;
  /**Lista dei nodi documentali nei quali si possono aggiungere cartelle */
  foldersAvailableToAddFolder: TreeNode<DocumentElement>[] = [];
  /**Lista dei nodi documentali nei quali si possono caricare file */
  foldersAvailableToFileUpload: TreeNode<DocumentElement>[] = [];
  /**Lista dei nodi documentale nei quali si possono spostare elementi */
  foldersAvailableToMoveElementIn: TreeNode<DocumentElement>[] = [];
  /**Definisce se si è superata la dimensione massima di un file */
  isFileSizeExceed = false;
  /**Definisce se un file è stato caricato */
  isFileUploaded = false;
  /**Definisce se l'uploader dei file è stato toccato */
  isFileUploaderTouched = false;
  /**Lista degli elementi del menu */
  items: MenuItem[] = [];
  /**Definisce se è in corso un caricamento */
  loading = false;
  /**Nome della nuova cartella */
  newFolderName: string | undefined;
  /**Nuovo nome */
  newName: string | undefined;
  /**Dati grezzi */
  rawData: any;
  /**Nodo documentale selezionato */
  selectedDocument: TreeNode<DocumentElement> | undefined;
  /**Nodo documentale di tipo cartella selezionato */
  selectedFolderNode: TreeNode<DocumentElement> | undefined;
  selectedNode: TreeNode<CorpusElement> | undefined;

  /**Riferimento all'albero documentale */
  @ViewChild('tree') public tree: any;

  /**Riferimento al form di aggiunta folder */
  addFolderRForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    parentFolder: new FormControl<TreeNode<CorpusElement> | null>(null, Validators.required)
  });
  get addFolderName() { return this.addFolderRForm.get('name'); }
  get addFolderParent() { return this.addFolderRForm.get('parentFolder'); }
  set setAddFolderParent(node: TreeNode<CorpusElement>) { this.addFolderRForm.get('parentFolder')?.setValue(node); }

  renameElementForm = new FormGroup({
    newName: new FormControl<string>('', [Validators.required, whitespacesValidator]),
  });
  get getNewName() { return this.renameElementForm.get('newName'); }
  set setNewName(n: string) { this.getNewName?.setValue(n); }

  moveElementForm = new FormGroup({
    targetFolder: new FormControl<TreeNode<CorpusElement> | null>(null, Validators.required),
  });
  get getTargetFolder() { return this.moveElementForm.get('targetFolder'); }
  set setTargetFolder(node: TreeNode<CorpusElement>) { this.getTargetFolder?.setValue(node); }

  uploaderForm = new FormGroup({
    file: new FormControl<File | null>(null, Validators.required),
    parentFolder: new FormControl<TreeNode<CorpusElement> | null>(null, Validators.required)
  });
  get getFile() { return this.uploaderForm.get('file'); }
  get getParentFolder() { return this.uploaderForm.get('parentFolder'); }
  set setParentFolder(node: TreeNode<CorpusElement>) { this.getParentFolder?.setValue(node); }

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per WorkspaceCorpusExplorerComponent
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato
   * @param workspaceService {WorkspaceService} servizi relativi ai workspace
   * @param loaderService {LoaderService} servizi per la gestione del segnale di caricamento
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param msgConfService {MessageConfigurationService} servizi per la configurazione dei messaggi per messageService
   */
  constructor(
    private loggedUserService: LoggedUserService,
    private workspaceService: WorkspaceService,
    private loaderService: LoaderService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private corpusStateService: CorpusStateService,
  ) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per il recupero dei dati iniziali */
  ngOnInit(): void {
    this.updateDocumentSystem()
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per la chiusura di eventuali popup swal */
  ngOnDestroy(): void {
    Swal.close();
  }

  /**
   * Metodo che gestisce la selezione di un nodo dell'albero documentale
   * @param event {any} evento di click su un nodo dell'albero documentale
   */
  nodeSelect(event: { originalEvent: MouseEvent, node: TreeNode<CorpusElement> }): void {
    this.clickCount++; //unito al timeout, viene utilizzato per gestire comportamenti diversi per click singolo e doppio click

    setTimeout(() => {
      if (this.clickCount === 1) { //caso del click singolo al momento non utilizzato
      } else if (this.clickCount === 2) {
        if (event.node.data?.type === ElementType.RESOURCE) {
          //TODO inserire meccanismo di apertura testo
          return;
        }
        event.node.expanded = !event.node.expanded;
      }
      this.clickCount = 0;
    }, 250)
  }

  /**
   * Metodo che gestisce l'evento di upload di un file
   * @param event {any} evento di upload di un file
   * @returns {void}
   */
  onFileUpload(event: any): void {
    if (event.target.files.length == 0) {
      this.fileUploaded = undefined;
      return;
    }

    if (event.target.files[0].size > 10 * 1024 * 1024) {
      this.fileUploaded = undefined;
      this.isFileUploaded = false;
      this.isFileSizeExceed = true;
      return;
    }

    this.fileUploaded = event.target.files[0];

    this.isFileUploaded = true;
    this.isFileSizeExceed = false;
  }

  /**Metodo che gestisce il tocco sull'uploader */
  onFileUploaderTouch(): void {
    this.isFileUploaderTouched = true;
  }

  /**
   * Metodo che sottomette il form di aggiunta cartella
   * @returns {void}
   */
  onSubmitAddFolderModal(): void {
    if (this.addFolderRForm.invalid) { //caso di form non valido
      this.addFolderRForm.markAllAsTouched();
      return;
    }

    const parentFolderId = this.addFolderParent?.value?.data?.id;
    const folderName = this.addFolderName?.value;

    if (!parentFolderId || !folderName) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Missing data'));
      return;
    }

    this.corpusStateService.addElement.next({
      elementType: ElementType.FOLDER,
      parentFolderId: parentFolderId,
      elementName: folderName
    });

    this.visibleAddFolder = false;

  }

  /**
   * Metodo che sottomette l'upload di un file
   * @returns {void}
   */
  onSubmitFileUploaderModal(): void {
    if (this.uploaderForm.invalid || !this.fileUploaded) { //caso di form non valido o file non caricato
      return this.saveUploadFileWithFormErrors();
    }

    if (this.fileUploaded && this.getParentFolder?.valid) {
      this.corpusStateService.uploadFile.next({ parentId: this.getParentFolder.value!.data!.id, resourceName: this.fileUploaded.name.split('.')[0], file: this.fileUploaded });
    }
    else {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Error loading file"));
    }

    this.visibleUploadFile = false;
  }

  /**
   * Metodo che sottomette il form di spostamento di un elemento nel sistema documentale
   * @returns {void}
   */
  onSubmitMoveModal(): void {
    if (this.moveElementForm.invalid) {
      this.moveElementForm.markAllAsTouched();
      return;
    }

    if (this.selectedNode?.data?.id === this.getTargetFolder?.value?.data?.id) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(`You cannot move the folder ${this.selectedNode?.label} within itself`));
      return;
    }

    this.corpusStateService.moveElement.next({
      elementType: this.selectedNode!.data!.type,
      elementId: this.selectedNode!.data!.id,
      targetId: this.getTargetFolder!.value!.data!.id
    });

    this.visibleMove = false;
  }

  /**
   * Metodo che sottomette il form per rinominare un elemento documentale
   * @returns {void}
   */
  onSubmitRenameModal(): void {
    if (this.renameElementForm.invalid) {
      this.renameElementForm.markAllAsTouched();
      return;
    }

    const newName = this.getNewName?.value;

    if (!newName) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig('New name missing'));
      return;
    }

    if (newName === this.selectedNode?.label) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig('New name is equal to current name'));
      return;
    }
    const elementType = this.selectedNode!.data!.type;
    const elementId = this.selectedNode!.data!.id;
    this.corpusStateService.renameElement.next({ elementType: elementType, elementId: elementId, newName: newName }); //BUG ottengo un internal server error

    this.visibleRename = false;

  }

  /**
   * Metodo che gestisce la visualizzazione del menu contestuale
   * @param event {any} evento di click con tasto destro
   * @param cm {ContextMenu} menu contestuale //TODO verificare possibile rimozione in quanto non utilizzato
   */
  onTreeContextMenuSelect(event: any, cm: ContextMenu): void {
    this.generateContextMenu(event.node);
  }

  onOpenContextMenu(event: { originalEvent: PointerEvent, node: TreeNode<CorpusElement> }) {
    this.generateContextMenu(event.node);
  }

  reload(): void {
    // this.updateDocumentSystem();
    this.corpusStateService.refreshFileSystem.next(null);
    this.selectedNode = undefined;
  }

  /**Metodo che gestisce la visualizzazione del form di aggiunta cartella */
  showAddFolderModal(): void {
    this.addFolderRForm.reset();

    if (this.selectedNode?.data?.type === ElementType.FOLDER) {
      this.setAddFolderParent = this.selectedNode;
    }

    this.folders$ = this.files$.pipe(
      switchMap(nodes => of(this.mapToOnlyFolders(nodes))),
    );

    this.visibleAddFolder = true;
  }

  /**Metodo che gestisce la visualizzazione del popup di conferma cancellazione di un elemento documentale */
  showDeleteModal(): void {
    if (this.selectedDocument && this.selectedDocument.data) {
      const element_id = this.selectedDocument.data['element-id'];
      const name = this.selectedDocument.data.name || "";
      const type = this.selectedDocument.data.type;

      let confirmMsg = 'Stai per cancellare la cartella \'' + name + '\'';

      if (type == _ElementType.File) {
        confirmMsg = 'Stai per cancellare il file \'' + name + '\'';
      }

      this.popupDeleteItem.confirmMessage = confirmMsg;

      this.popupDeleteItem.showDeleteConfirm(() => this.deleteElement(element_id, name, type), element_id, name, type);
    }
  }

  /**Metodo che gestisce la visualizzazione del modale di spostamento di un elemento documentale */
  showMoveModal(): void {
    this.moveElementForm.reset();
    this.folders$ = this.files$.pipe(
      switchMap(nodes => of(this.mapToOnlyFolders(nodes))),
    );
    this.visibleMove = true;
  }

  /**Metodo che gestisce la visualizzazione del modale per rinominare un elemento documentale */
  showRenameModal(): void {
    this.renameElementForm.reset();

    if (this.selectedNode?.label) {
      this.setNewName = this.selectedNode.label;
    }

    this.visibleRename = true;
  }

  /**Metodo che gestisce la visualizzazione del modale di caricamento di un nuovo file */
  showUploadFileModal(): void {
    this.uploaderForm.reset();
    this.folders$ = this.files$.pipe(
      switchMap(nodes => of(this.mapToOnlyFolders(nodes))),
    );
    if (this.selectedNode?.data?.type === ElementType.FOLDER) {
      this.setParentFolder = this.selectedNode;
    }
    this.visibleUploadFile = true;
  }

  /**
   * @private
   * Metodo che mappa la lista di elementi documento e restituisce una lista di nodi dell'albero
   * @param docs {DocumentElement[]} lista degli elementi documentali
   * @returns {TreeNode<any>[]} lista di nodi dell'albero
   */
  private documentsToTreeNodes(docs: DocumentElement[]) {
    const dataParsed = [];

    for (const d of docs) {
      dataParsed.push(this.documentToTreeNode(d));
    }

    return dataParsed;
  }

  /**
   * @private
   * Metodo che mappa un elemento documentale per restituire un nodo dell'albero
   * @param doc {DocumentElement} elemento documentale
   * @returns {TreeNode} nodo dell'albero
   */
  private documentToTreeNode(doc: DocumentElement): TreeNode {
    const node: TreeNode<DocumentElement> = {};

    if (doc.children) {
      node.children = this.documentsToTreeNodes(doc.children);
    }

    if (doc.type == _ElementType.Directory) {
      node.expandedIcon = "pi pi-folder-open";
      node.collapsedIcon = "pi pi-folder";
    }
    else if (doc.type == _ElementType.File) {
      node.icon = "pi pi-file";
      node.leaf = true;
    }

    node.label = doc.name;
    node.data = doc;

    return node;
  }

  private mapToOnlyFolders(nodes: TreeNode<CorpusElement>[]): TreeNode<CorpusElement>[] {
    const folderTree: TreeNode<CorpusElement>[] = [];
    nodes.forEach(node => {
      if (node.data?.type === ElementType.FOLDER) {
        if (node.children?.length === 0) {
          folderTree.push(node);
        } else if (node.children) {
          folderTree.push({
            ...node,
            children: this.mapToOnlyFolders(node.children)
          });
        }
      }
    })
    return folderTree;
  }

  private mapToTreeNodes(elements: CorpusElement[]): TreeNode<CorpusElement>[] {
    const result: TreeNode<CorpusElement>[] = [];
    elements.forEach(element => {
      result.push(this.mapToTreeNode(element));
    });
    return result;
  }

  private mapToTreeNode(element: CorpusElement): TreeNode<CorpusElement> {
    const node: TreeNode<CorpusElement> = {};
    if ('children' in element) {
      const e = <FolderElement>element;
      node.children = this.mapToTreeNodes(e.children);
      node.expandedIcon = "pi pi-folder-open";
      node.collapsedIcon = "pi pi-folder";
    }
    if (element.type === ElementType.RESOURCE) {
      node.icon = "pi pi-file";
      node.leaf = true;
    }
    node.label = element.name;
    node.data = element;
    return node;
  }

  /**
   * @private
   * Metodo che produce il menu contestuale customizzato
   * @param node {TreeNode} nodo dell'albero documentale sul quale è avvenuto il click
   * @returns {void}
   */
  private generateContextMenu(node: TreeNode<CorpusElement>): void {
    const menuAddFolder = {
      label: 'Aggiungi cartella',
      icon: 'fa-solid fa-folder-plus',
      command: (event: any) => {
        console.info('add folder event', event)
        this.showAddFolderModal()
      }
    }
    const cmItems = [];
    if (node.data?.type === ElementType.FOLDER) {
      cmItems.push(menuAddFolder);
    }

    cmItems.push(...[
      {
        label: 'Sposta',
        icon: 'fa-solid fa-sync',
        command: (event: any) => {
          this.showMoveModal()
        }
      },
      {
        label: 'Elimina',
        icon: 'pi pi-trash',
        command: (event: any) => {
          this.showDeleteModal()
        }
      }
    ]);

    const menuRename = {
      label: 'Rinomina',
      icon: 'fa-solid fa-pen',
      command: (event: any) => {
        this.showRenameModal()
      }
    }
    if (node.data?.type === ElementType.RESOURCE) {
      cmItems.unshift(menuRename);
    } else {
      cmItems.push(menuRename);
    }

    this.items = cmItems;
  }

  /**
   * @private
   * Metodo che restituisce l'albero documentale omettendone i nodi di tipo file
   * @param docs {any[]} lista dei documenti
   * @returns {TreeNode<any>[]} lista dei nodi dell'albero
   */
  private omitFiles(docs: any[]) {
    const dataParsed: TreeNode<any>[] = [];

    docs.forEach((obj) => {
      if (obj.data.type != _ElementType.File) {
        obj.children = this.omitFiles(obj.children);
        dataParsed.push(obj);
      }
    })

    return dataParsed;
  }

  /**
   * @private
   * Metodo che resetta il form di aggiunta folder
   */
  private resetAddFolderForm(): void {
    $('#addFolderForm').trigger("reset");

    this.selectedFolderNode = undefined;
  }

  /**
   * @private
   * Metodo che resetta il form di caricamento di un nuovo file
   */
  private resetFileUploaderForm(): void {
    $('#fileUploaderForm').trigger("reset");

    this.isFileUploaded = false;
    this.isFileUploaderTouched = false;
    this.selectedFolderNode = undefined;
  }

  /**
   * @private
   * Metodo che resetta il form di spostamento di un elemento documentale
   */
  private resetMoveForm(): void {
    $('#moveForm').trigger("reset");

    this.selectedFolderNode = undefined;
  }

  /**
   * @private
   * Metodo che resetta il form per rinominare un elemento documentale
   */
  private resetRenameForm(): void {
    $('#renameForm').trigger("reset");
  }

  /**
   * @private
   * Metodo che segna i campi del form come touched e segnala il mancato caricamento
   */
  private saveUploadFileWithFormErrors(): void {
    this.uploaderForm.markAllAsTouched();

    if (!this.fileUploaded) {
      this.isFileUploaded = false;
      this.isFileUploaderTouched = true;
    }
  }

  /**
   * @private
   * Metodo che visualizza il popup di operazione fallita
   * @param errorMessage {string} messaggio di errore
   */
  private showOperationFailed(errorMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: errorMessage,
      showConfirmButton: true
    });
  }

  /**
   * @private
   * Metodo che visualizza il popup di operazione in corso
   * @param message {string} messaggio da visualizzare
   */
  private showOperationInProgress(message: string): void {
    Swal.fire({
      icon: 'warning',
      titleText: message,
      text: 'per favore attendere',
      customClass: {
        container: 'swal2-container'
      },
      showCancelButton: false,
      showConfirmButton: false
    });
  }

  /**
   * @private
   * Metodo che data una lista di nodi ne recupera uno sulla base dell'identificativo
   * @param source {any[]} lista dei nodi
   * @param element {any} elemento cercato
   * @returns {any} nodo della lista corrispondente
   */
  private searchNodeByElementId(source: any[], element: any): any {
    for (const el of source) {
      if (el.data?.['element-id'] == element.data?.['element-id']) {
        return el;
      }

      if (el.children && el.children.lenght != 0) {
        const node = this.searchNodeByElementId(el.children, element);

        if (node) {
          return node;
        }
      }
    }

    return undefined;
  }

  /**
   * @private
   * Metodo che aggiorna il sistema documentale
   */
  private updateDocumentSystem() {
    this.loading = true;
    this.loaderService.show();

    this.workspaceService.retrieveCorpus();

    this.workspaceService._retrieveCorpus().subscribe({
      next: (data) => {
        if (data.documentSystem) {
          this.rawData = JSON.parse(JSON.stringify(data.documentSystem))
          const rootNode = {
            path: "/root/",
            name: "Corpus",
            type: _ElementType.Directory,
            'element-id': 0,
            metadata: {},
            children: this.rawData
          }

          const fileTree = [];
          fileTree.push(rootNode);

          this.files = this.documentsToTreeNodes(fileTree);

          if (this.files.length > 0) {
            this.files[0].expanded = true;
            this.files[0].draggable = false;
            this.files[0].droppable = true;
          }

          const filesDeepCopy = JSON.parse(JSON.stringify(this.files))

          const docSystemWithoutFiles = this.omitFiles(filesDeepCopy);
          this.foldersAvailableToAddFolder = JSON.parse(JSON.stringify(docSystemWithoutFiles));

          if (docSystemWithoutFiles.length > 0) {
            docSystemWithoutFiles[0].selectable = false;
          }

          this.foldersAvailableToFileUpload = docSystemWithoutFiles;
        }

        this.tree.resetFilter();
        this.loaderService.hide();
        this.loading = false;
      }
    })
  }
}
