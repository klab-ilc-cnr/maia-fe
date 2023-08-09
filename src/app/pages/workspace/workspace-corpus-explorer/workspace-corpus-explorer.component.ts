import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MenuItem, MessageService, TreeNode } from 'primeng/api';
import { Observable, of, switchMap } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { ElementType } from 'src/app/models/corpus/element-type';
import { Roles } from 'src/app/models/roles';
import { CorpusElement, FolderElement } from 'src/app/models/texto/corpus-element';
import { CorpusStateService } from 'src/app/services/corpus-state.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

/**Componente del pannello di esplorazione corpus */
@Component({
  selector: 'app-workspace-corpus-explorer',
  templateUrl: './workspace-corpus-explorer.component.html',
  styleUrls: ['./workspace-corpus-explorer.component.scss'],
  providers: [CorpusStateService]
})
export class WorkspaceCorpusExplorerComponent {
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
   * @param type {ElementType} tipo di elemento (cartella o file)
   */
  private deleteElement = (id: number, type: ElementType): void => {
    this.corpusStateService.removeElement.next({ elementType: type, elementId: id });
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

  /**File caricato */
  fileUploaded: File | undefined;
  /**Definisce se si è superata la dimensione massima di un file */
  isFileSizeExceed = false;
  /**Definisce se un file è stato caricato */
  isFileUploaded = false;
  /**Definisce se l'uploader dei file è stato toccato */
  isFileUploaderTouched = false;
  /**Lista degli elementi del menu */
  items: MenuItem[] = [];
  /**Nodo documentale selezionato */
  selectedNode: TreeNode<CorpusElement> | undefined;

  /**Riferimento al form di aggiunta folder */
  addFolderRForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    parentFolder: new FormControl<TreeNode<CorpusElement> | null>(null)
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
    targetFolder: new FormControl<TreeNode<CorpusElement> | null>(null),
  });
  get getTargetFolder() { return this.moveElementForm.get('targetFolder'); }
  set setTargetFolder(node: TreeNode<CorpusElement>) { this.getTargetFolder?.setValue(node); }

  uploaderForm = new FormGroup({
    file: new FormControl<File | null>(null, Validators.required),
    parentFolder: new FormControl<TreeNode<CorpusElement> | null>(null)
  });
  get getFile() { return this.uploaderForm.get('file'); }
  get getParentFolder() { return this.uploaderForm.get('parentFolder'); }
  set setParentFolder(node: TreeNode<CorpusElement>) { this.getParentFolder?.setValue(node); }

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per WorkspaceCorpusExplorerComponent
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param msgConfService {MessageConfigurationService} servizi per la configurazione dei messaggi per messageService
   */
  constructor(
    private loggedUserService: LoggedUserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private corpusStateService: CorpusStateService,
  ) { }

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
          this.onTextSelectEvent.emit(event.node.data);
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

    let parentFolderId = this.addFolderParent?.value?.data?.id;
    const folderName = this.addFolderName?.value;

    if (!folderName) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig('Missing data'));
      return;
    }

    if (!parentFolderId) {
      parentFolderId = -1;
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
      const parentId = this.getParentFolder.value?.data?.id;
      this.corpusStateService.uploadFile.next({ parentId: (parentId ? parentId : -1), resourceName: this.fileUploaded.name.split('.')[0], file: this.fileUploaded });
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
      targetId: this.getTargetFolder?.value?.data?.id ?? -1
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

  onOpenContextMenu(event: { originalEvent: PointerEvent, node: TreeNode<CorpusElement> }) {
    this.generateContextMenu(event.node);
  }

  reload(): void {
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
    if (this.selectedNode && this.selectedNode.data) {
      const element_id = this.selectedNode.data.id;
      const name = this.selectedNode.label || "";
      const type = this.selectedNode.data.type;

      let confirmMsg = `You are about to delete the ${name} folder`;
      if (type == ElementType.RESOURCE) {
        confirmMsg = `You are about to delete the ${name} file`;
      }

      this.popupDeleteItem.confirmMessage = confirmMsg;

      this.popupDeleteItem.showDeleteConfirm(() => this.deleteElement(element_id, type), element_id, type);
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
      label: 'Add folder',
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
        label: 'Move',
        icon: 'fa-solid fa-sync',
        command: (event: any) => {
          this.showMoveModal()
        }
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: (event: any) => {
          this.showDeleteModal()
        }
      }
    ]);

    const menuRename = {
      label: 'Rename',
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
   * Metodo che segna i campi del form come touched e segnala il mancato caricamento
   */
  private saveUploadFileWithFormErrors(): void {
    this.uploaderForm.markAllAsTouched();

    if (!this.fileUploaded) {
      this.isFileUploaded = false;
      this.isFileUploaderTouched = true;
    }
  }
}
