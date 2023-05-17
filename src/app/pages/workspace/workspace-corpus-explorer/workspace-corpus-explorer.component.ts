import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { ContextMenu } from 'primeng/contextmenu';
import { DocumentElement } from 'src/app/models/corpus/document-element';
import { ElementType, _ElementType } from 'src/app/models/corpus/element-type';
import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MenuItem, MessageService, TreeNode } from 'primeng/api';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { NgForm } from '@angular/forms';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import Swal from 'sweetalert2';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { LoaderService } from 'src/app/services/loader.service';
import { Roles } from 'src/app/models/roles';
import { of, switchMap } from 'rxjs';
import { CorpusElement, ResourceElement } from 'src/app/models/texto/corpus-element';
import { FolderElement } from 'src/app/models/texto/corpus-element';
import { CorpusStateService } from 'src/app/services/corpus-state.service';

/**Variabile globale (jQuery?) */
declare var $: any;

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
  };

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
  };

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
  };

  /**Lista dei nodi documentali */
  files: TreeNode<DocumentElement>[] = [];
  /**File caricato */
  fileUploaded: any = undefined;
  /**Lista dei nodi documentali nei quali si possono aggiungere cartelle */
  foldersAvailableToAddFolder: TreeNode<DocumentElement>[] = [];
  /**Lista dei nodi documentali nei quali si possono caricare file */
  foldersAvailableToFileUpload: TreeNode<DocumentElement>[] = [];
  /**Lista dei nodi documentale nei quali si possono spostare elementi */
  foldersAvailableToMoveElementIn: TreeNode<DocumentElement>[] = [];
  /**Definisce se si è superata la dimensione massima di un file */
  isFileSizeExceed: boolean = false;
  /**Definisce se un file è stato caricato */
  isFileUploaded: boolean = false;
  /**Definisce se l'uploader dei file è stato toccato */
  isFileUploaderTouched: boolean = false;
  /**Lista degli elementi del menu */
  items: MenuItem[] = [];
  /**Definisce se è in corso un caricamento */
  loading: boolean = false;
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

  /**Riferimento all'uploader dei file */
  @ViewChild('fileUploader') public fileUploader!: ElementRef;
  /**Riferimento all'albero documentale */
  @ViewChild('tree') public tree: any;

  /**Riferimento al form di aggiunta folder */
  @ViewChild('addFolderForm') public addFolderForm!: NgForm;
  /**Riferimento al form dell'uploader di file */
  @ViewChild('fileUploaderForm') public fileUploaderForm!: NgForm;
  /**Riferimento al form di spostamento elemento */
  @ViewChild('moveForm') public moveForm!: NgForm;
  /**Riferimento al form per rinominare un elemento documentale */
  @ViewChild('renameForm') public renameForm!: NgForm;

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
    private loggedUserService : LoggedUserService,
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
  nodeSelect(event: any): void {
    this.clickCount++; //unito al timeout, viene utilizzato per gestire comportamenti diversi per click singolo e doppio click

    setTimeout(() => {
      if (this.clickCount === 1) { //caso del click singolo al momento non utilizzato
      } else if (this.clickCount === 2) {
        if (event.node.data?.type == _ElementType.File) {
          this.onTextSelectEvent.emit(event)
        }
        else if (event.node.data?.type == _ElementType.Directory) {
          event.node.expanded = !event.node.expanded;
        }
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
    if (this.addFolderForm.invalid) { //caso di form non valido
      this.addFolderForm.form.markAllAsTouched();
      return ;
    }

    let element_id = this.addFolderForm.form.value.folderToAdd.data?.['element-id'];
    let name = this.addFolderForm.form.value.nfName;

    this.loaderService.show();
    this.workspaceService._addFolder(element_id).subscribe({
      next: (result) => {
        if (result['response-status'] == 0) { //caso response status 0 considerato esito positivo
          let newId = result.node['element-id'];

          this.workspaceService._renameElement(newId, name, _ElementType.Directory).subscribe({
            next: (result) => {
              $('#addFolderModal').modal('hide');

              if (result.responseStatus == 0) { //caso responseStatus 0 creazione avvenuta
                this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Cartella \'' + name + '\' creata con successo'));
              }
              else { //caso errore in creazione folder
                this.workspaceService._removeElement(newId, _ElementType.Directory).subscribe({
                  next: (result) => {
                    this.messageService.add(this.msgConfService.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''));
                  },
                  error: () => {
                    this.messageService.add(this.msgConfService.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''));
                  }
                })
              }

              this.loaderService.hide();

              this.updateDocumentSystem();
            },
            error: () => {
              $('#addFolderModal').modal('hide');
              this.loaderService.hide();
              this.messageService.add(this.msgConfService.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''));
            }
          })
        }
        else if (result['response-status'] == 1) { //caso status 1 utente non autorizzato
          $('#addFolderModal').modal('hide');
          this.loaderService.hide();
          this.messageService.add(this.msgConfService.generateErrorMessageConfig('Utente non autorizzato'));
        }
        else { //caso errore di creazione
          $('#addFolderModal').modal('hide');
          this.loaderService.hide();
          this.messageService.add(this.msgConfService.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''));
        }

        $('#addFolderModal').modal('hide');

        this.updateDocumentSystem();
      },
      error: (err) => {
        $('#addFolderModal').modal('hide');
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''));
      }
    })

    $('#addFolderModal').modal('hide');
  }

  /**
   * Metodo che sottomette l'upload di un file
   * @returns {void}
   */
  onSubmitFileUploaderModal(): void {
    if (this.fileUploaderForm.invalid || !this.fileUploaded) { //caso di form non valido o file non caricato
      return this.saveUploadFileWithFormErrors();
    }

    if (this.fileUploaded && this.selectedFolderNode) {
      let element_id = this.fileUploaderForm.form.value.folderToUpload.data["element-id"];
      let name = this.fileUploaded.name;
      let folderName = this.fileUploaderForm.form.value.folderToUpload.data.name;

      let errorMsg = 'Errore nel caricare il file \'' + name + '\' in \'' + folderName + '\'';
      let successMsg = 'File \'' + name + '\' caricato con successo in \'' + folderName + '\'';

      this.loaderService.show();
      this.workspaceService._uploadFile(element_id, this.fileUploaded).subscribe({
        next: (result) => {
          $('#uploadFileModal').modal('hide');

          if (result['response-status'] == 0) {
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
          }
          else if (result['response-status'] == 1) {
            this.messageService.add(this.msgConfService.generateErrorMessageConfig('Utente non autorizzato'));
          }
          else {
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
          }

          this.loaderService.hide();

          this.updateDocumentSystem();
        },
        error: () => {
          $('#uploadFileModal').modal('hide');
          this.loaderService.hide();
          this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
        }
      })
    }
    else {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore nell'operazione di caricamento file"));
    }

    $('#uploadFileModal').modal('hide');
  }

  /**
   * Metodo che sottomette il form di spostamento di un elemento nel sistema documentale
   * @returns {void}
   */
  onSubmitMoveModal(): void {
    if (this.moveForm.invalid) {
      this.moveForm.form.markAllAsTouched();
      return;
    }

    if (this.selectedDocument && this.selectedDocument.data) {
      let element_id = this.selectedDocument.data['element-id'];
      let name = this.selectedDocument.data.name;
      let newParentName = this.moveForm.form.value.folderToMoveIn.data.name;
      let target_id = this.moveForm.form.value.folderToMoveIn.data["element-id"];
      let type = this.selectedDocument.data.type;

      let errorMsg = 'Errore nello spostare la cartella \'' + name + '\' in \'' + newParentName + '\'';
      let successMsg = 'Cartella \'' + name + '\' spostata con successo';

      if (type == _ElementType.File) {
        errorMsg = 'Errore nello spostare il file \'' + name + '\' in \'' + newParentName + '\'';
        successMsg = 'File \'' + name + '\' spostato con successo';
      }

      this.loaderService.show();
      this.workspaceService._moveElement(element_id, target_id, type).subscribe({
        next: (result) => {
          $('#moveModal').modal('hide');

          if (result.responseStatus == 0) {
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
          }
          else if (result.responseStatus == 1) {
            this.messageService.add(this.msgConfService.generateErrorMessageConfig('Utente non autorizzato'));
          }
          else {
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
          }

          this.loaderService.hide();

          this.updateDocumentSystem();
        },
        error: () => {
          $('#moveModal').modal('hide');
          this.loaderService.hide();
          this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
        }
      })
    }
    else {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore nell'operazione di spostamento"));
    }

    $('#moveModal').modal('hide');
  }

  /**
   * Metodo che sottomette il form per rinominare un elemento documentale
   * @returns {void}
   */
  onSubmitRenameModal(): void {
    if (this.renameForm.invalid) {
      this.renameForm.form.markAllAsTouched();
      return;
    }

    if (this.selectedDocument && this.selectedDocument.data) {
      let element_id = this.selectedDocument.data['element-id'];
      let newName = this.renameForm.form.value.newElementName;
      let oldName = this.selectedDocument.data.name;
      let type = this.selectedDocument.data.type;

      let errorMsg = 'Errore nel rinominare la cartella \'' + oldName + '\' in \'' + newName + '\'';
      let successMsg = 'Cartella \'' + newName + '\' rinominata con successo';

      if (type == _ElementType.File) {
        errorMsg = 'Errore nel rinominare il file \'' + oldName + '\' in \'' + newName + '\'';
        successMsg = 'File \'' + newName + '\' rinominato con successo';
      }

      this.loaderService.show();
      this.workspaceService._renameElement(element_id, newName, type).subscribe({
        next: (result) => {
          $('#renameModal').modal('hide');

          if (result.responseStatus == 0) {
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
          }
          else if (result.responseStatus == 1) {
            this.messageService.add(this.msgConfService.generateErrorMessageConfig('Utente non autorizzato'));
          }
          else {
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
          }

          this.loaderService.hide();
          this.updateDocumentSystem();
        },
        error: () => {
          $('#renameModal').modal('hide');
          this.loaderService.hide();
          this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
        }
      })
    }
    else {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore nell'operazione di rinominazione"));
    }

    $('#renameModal').modal('hide');
  }

  /**
   * Metodo che gestisce la visualizzazione del menu contestuale
   * @param event {any} evento di click con tasto destro
   * @param cm {ContextMenu} menu contestuale //TODO verificare possibile rimozione in quanto non utilizzato
   */
  onTreeContextMenuSelect(event: any, cm: ContextMenu): void {
    this.generateContextMenu(event.node);
  }

  reload(): void {
    // this.updateDocumentSystem();
    this.corpusStateService.refreshFileSystem.next(null);
  }

  /**Metodo che gestisce la visualizzazione del form di aggiunta cartella */
  showAddFolderModal(): void {
    this.resetAddFolderForm();

    if (this.selectedDocument && this.selectedDocument.data?.type == _ElementType.Directory) {
      var node = this.searchNodeByElementId(this.foldersAvailableToAddFolder, this.selectedDocument);

      if (node) {
        this.selectedFolderNode = node;
      }
    }

    $('#addFolderModal').appendTo('body').modal('show');
  }

  /**Metodo che gestisce la visualizzazione del popup di conferma cancellazione di un elemento documentale */
  showDeleteModal(): void {
    if (this.selectedDocument && this.selectedDocument.data) {
      let element_id = this.selectedDocument.data['element-id'];
      let name = this.selectedDocument.data.name || "";
      let type = this.selectedDocument.data.type;

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
    this.resetMoveForm();

    this.foldersAvailableToMoveElementIn = [];

    if (this.selectedDocument) {
      if (this.selectedDocument.data?.type == _ElementType.Directory){
        this.foldersAvailableToMoveElementIn = this.foldersAvailableToAddFolder;
      }
      else {
        this.foldersAvailableToMoveElementIn = this.foldersAvailableToFileUpload;
      }
    }

    $('#moveModal').appendTo('body').modal('show');
  }

  /**Metodo che gestisce la visualizzazione del modale per rinominare un elemento documentale */
  showRenameModal(): void {
    this.resetRenameForm();

    if (this.selectedDocument) {
      this.newName = this.selectedDocument?.label;
    }

    $('#renameModal').appendTo('body').modal('show');
  }

  /**Metodo che gestisce la visualizzazione del modale di caricamento di un nuovo file */
  showUploadFileModal(): void {
    this.resetFileUploaderForm();

    if (this.selectedDocument && this.selectedDocument.data?.type == _ElementType.Directory) {
      var node = this.searchNodeByElementId(this.foldersAvailableToFileUpload, this.selectedDocument);

      if (node) {
        this.selectedFolderNode = node;
      }
    }

    $('#uploadFileModal').appendTo('body').modal('show');
  }

  /**
   * @private
   * Metodo che mappa la lista di elementi documento e restituisce una lista di nodi dell'albero
   * @param docs {DocumentElement[]} lista degli elementi documentali
   * @returns {TreeNode<any>[]} lista di nodi dell'albero
   */
  private documentsToTreeNodes(docs: DocumentElement[]) {
    var dataParsed = [];

    for (let d of docs) {
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
    var node: TreeNode<DocumentElement> = {};

    if (doc.children) {
      node.children =  this.documentsToTreeNodes(doc.children);
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

  private mapToTreeNodes(elements: CorpusElement[]): TreeNode<CorpusElement>[] {
    const result: TreeNode<CorpusElement>[] = [];
    elements.forEach(element => {
      result.push(this.mapToTreeNode(element));
    });
    return result;
  }

  private mapToTreeNode(element: CorpusElement): TreeNode<CorpusElement> {
    const node: TreeNode<CorpusElement> = {};
    if('children' in element) {
      const e = <FolderElement>element;
      node.children = this.mapToTreeNodes(e.children);
      node.expandedIcon = "pi pi-folder-open";
      node.collapsedIcon = "pi pi-folder";
    }
    if(element.type === ElementType.RESOURCE) {
      const e = <ResourceElement>element;
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
  private generateContextMenu(node: TreeNode): void {
    var menuAddFolder = {
      label: 'Aggiungi cartella',
      icon: 'fa-solid fa-folder-plus',
      command: (event: any) => {
        this.showAddFolderModal()
      }
    }

    if (node.data.name == "Corpus") {
      this.items = [menuAddFolder];
      return;
    }

    let cmItems = [
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
    ];

    let menuRename = {
      label: 'Rinomina',
      icon: 'fa-solid fa-pen',
      command: (event: any) => {
        this.showRenameModal()
      }
    }

    cmItems.unshift(menuRename);

    if (node.data.type == _ElementType.Directory) {
      cmItems.unshift(menuAddFolder);
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
    var dataParsed: TreeNode<any>[] = [];

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
    this.fileUploaderForm.form.markAllAsTouched();

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
    for (let el of source) {
      if (el.data?.['element-id'] == element.data?.['element-id']) {
        return el;
      }

      if (el.children && el.children.lenght != 0) {
        let node = this.searchNodeByElementId(el.children, element);

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

    this.workspaceService.retrieveCorpus().subscribe(resp => {
      console.info('texto retrieve corpus', resp);
    })

    this.workspaceService._retrieveCorpus().subscribe({
      next: (data) => {
        if (data.documentSystem) {
          this.rawData = JSON.parse(JSON.stringify(data.documentSystem))
          let rootNode = {
            path: "/root/",
            name: "Corpus",
            type: _ElementType.Directory,
            'element-id': 0,
            metadata: {},
            children: this.rawData
          }

          let fileTree = [];
          fileTree.push(rootNode);

          this.files = this.documentsToTreeNodes(fileTree);

          if (this.files.length > 0) {
            this.files[0].expanded = true;
            this.files[0].draggable = false;
            this.files[0].droppable = true;
          }

          var filesDeepCopy = JSON.parse(JSON.stringify(this.files))

          var docSystemWithoutFiles = this.omitFiles(filesDeepCopy);
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
