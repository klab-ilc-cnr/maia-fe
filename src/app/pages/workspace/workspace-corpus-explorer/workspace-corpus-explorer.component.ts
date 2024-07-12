import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MenuItem, MessageService, TreeNode } from 'primeng/api';
import { Observable, of, switchMap } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { ElementType } from 'src/app/models/corpus/element-type';
import { CorpusElement, FolderElement } from 'src/app/models/texto/corpus-element';
import { FileUploadType } from 'src/app/models/texto/file-upload-type.enum';
import { CommonService } from 'src/app/services/common.service';
import { CorpusStateService } from 'src/app/services/corpus-state.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

/**Class of the corpus exploration component */
@Component({
  selector: 'app-workspace-corpus-explorer',
  templateUrl: './workspace-corpus-explorer.component.html',
  styleUrls: ['./workspace-corpus-explorer.component.scss'],
  providers: [CorpusStateService]
})
export class WorkspaceCorpusExplorerComponent {
  /**Observable of the corpus element tree */
  files$ = this.corpusStateService.filesystem$.pipe(
    switchMap(docs => of(this.mapToTreeNodes(docs))),
  );

  /**Observable of the list of folder nodes (possibly nested) in the corpus */
  folders$!: Observable<TreeNode<CorpusElement>[]>;

  //#region MODAL DISPLAY VARIABLES
  /**Defines the visibility of the creation panel of a new folder */
  visibleAddFolder = false;
  /**Defines the visibility of the panel to rename a corpus element */
  visibleRename = false;
  /**Defines the visibility of the panel to move an item in the corpus */
  visibleMove = false;
  /**Defines panel visibility for loading a new file into the corpus */
  visibleUploadFile = false;
  //#endregion

  /**
   * @private
   * Performs deletion of an item
   * @param id {number} element identifier
   * @param name {string} element name
   * @param type {ElementType} element type (folder or file)
   */
  private deleteElement = (id: number, type: ElementType): void => {
    this.corpusStateService.removeElement.next({ elementType: type, elementId: id });
    if (id === this.selectedNode?.data?.id) {
      this.selectedNode = undefined;
    }
  }

  /**Text selection event */
  @Output() onTextSelectEvent = new EventEmitter<any>();

  /**
   * @private
   * Click counting
   */
  private clickCount = 0;

  /**Getter that defines whether the delete option should be displayed */
  public get shouldDeleteBeDisplayed(): boolean {
    return this.loggedUserService.currentUser?.role == "ADMINISTRATOR"; //only administrator roles are entitled to cancellation
  }

  /**Uploaded file */
  fileUploaded: File | undefined;
  /**Defines whether the maximum size of a file has been exceeded */
  isFileSizeExceed = false;
  /**Defines whether a file has been uploaded */
  isFileUploaded = false;
  /**Definisce se l'uploader dei file è stato toccato */
  isFileUploaderTouched = false;
  /**Lista degli elementi del menu */
  items: MenuItem[] = [];
  /**Nodo documentale selezionato */
  selectedNode: TreeNode<CorpusElement> | undefined;

  /**Reference to add folder form */
  addFolderRForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    parentFolder: new FormControl<TreeNode<CorpusElement> | null>(null)
  });
  /**Getter for name in add folder form */
  get addFolderName() { return this.addFolderRForm.get('name'); }
  /**Getter for parentFolder in add folder form */
  get addFolderParent() { return this.addFolderRForm.get('parentFolder'); }
  /**Setter for parentFolder in add folder form */
  set setAddFolderParent(node: TreeNode<CorpusElement>) { this.addFolderRForm.get('parentFolder')?.setValue(node); }
  /**Form to rename a folder */
  renameElementForm = new FormGroup({
    newName: new FormControl<string>('', [Validators.required, whitespacesValidator]),
  });
  /**Getter for newName in rename folder form */
  get getNewName() { return this.renameElementForm.get('newName'); }
  /**Setter for newName in rename folder form */
  set setNewName(n: string) { this.getNewName?.setValue(n); }
  /**Form to move and element */
  moveElementForm = new FormGroup({
    targetFolder: new FormControl<TreeNode<CorpusElement> | null>(null),
  });
  /**Getter for targetFolder in move element form */
  get getTargetFolder() { return this.moveElementForm.get('targetFolder'); }
  /**Setter for targetFolder in move element form */
  set setTargetFolder(node: TreeNode<CorpusElement>) { this.getTargetFolder?.setValue(node); }
  /**Enum of the type of uploaders available (plain-text) */
  fileUploadTypes = Object.values(FileUploadType);
  /**Form to add a file to corpus */
  uploaderForm = new FormGroup({
    file: new FormControl<File | null>(null, Validators.required),
    fileType: new FormControl<FileUploadType>(FileUploadType.PLAIN),
    splitLine: new FormControl<boolean>(true),
    parentFolder: new FormControl<TreeNode<CorpusElement> | null>(null)
  });
  /**Getter for file in upload file form */
  get getFile() { return this.uploaderForm.get('file'); }
  /**Getter for parentFolder in upload file form */
  get getParentFolder() { return this.uploaderForm.get('parentFolder'); }
  /**Setter for parentFolder in upload file form */
  set setParentFolder(node: TreeNode<CorpusElement>) { this.getParentFolder?.setValue(node); }
  /**Getter for splitLine in upload file form */
  get getSplitLine() { return this.uploaderForm.get('splitLine'); }
  /**Setter for splitLine in upload file form */
  set setSplitLine(split: boolean) { this.getSplitLine?.setValue(split) }
  /**Getter for fileType in upload file form */
  get getFileType() { return this.uploaderForm.get('fileType') }

  /**Reference to cancellation confirmation popup */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costructor for WorkspaceCorpusExplorerComponent
   * @param loggedUserService {LoggedUserService} services related to logged user
   * @param messageService {MessageService} services to manage messages
   * @param msgConfService {MessageConfigurationService} services related to message configuration
   * @param corpusStateService {CorpusStateService} Corpus state management services
   * @param commonService {CommonService} services of common features
   */
  constructor(
    private loggedUserService: LoggedUserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private corpusStateService: CorpusStateService,
    private commonService: CommonService
  ) { }

  /**
   * Method that handles the selection of a node in the document tree
   * @param event { originalEvent: MouseEvent, node: TreeNode<CorpusElement> } Click event on a node in the document tree
   */
  nodeSelect(event: { originalEvent: MouseEvent, node: TreeNode<CorpusElement> }): void {
    this.clickCount++; //unito al timeout, viene utilizzato per gestire comportamenti diversi per click singolo e doppio click

    setTimeout(() => {
      if (this.clickCount === 1) { //caso del click singolo al momento non utilizzato
      } else if (this.clickCount === 2) {
        if (event.node.data?.type === ElementType.RESOURCE) {
          this.clickCount = 0;
          this.onTextSelectEvent.emit(event.node.data);
          return;
        }
        event.node.expanded = !event.node.expanded;
      }
      this.clickCount = 0;
    }, 250)
  }

  /**
   * Method that handles the upload event of a file
   * @param event {any} upload event of a file
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

  /**Method that handles touch on the uploader */
  onFileUploaderTouch(): void {
    this.isFileUploaderTouched = true;
  }

  /**
   * Method that submits the add folder form
   * @returns {void}
   */
  onSubmitAddFolderModal(): void {
    if (this.addFolderRForm.invalid) { //invalid form
      this.addFolderRForm.markAllAsTouched();
      return;
    }

    let parentFolderId = this.addFolderParent?.value?.data?.id;
    const folderName = this.addFolderName?.value;

    if (!folderName) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig(this.commonService.translateKey('CORPUS_EXPLORER.missingData')));
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
   * Method that submits the upload of a file
   * @returns {void}
   */
  onSubmitFileUploaderModal(): void {
    if (this.uploaderForm.invalid || !this.fileUploaded) { //invalid form or file not uploaded
      return this.saveUploadFileWithFormErrors();
    }

    if (this.fileUploaded && this.getParentFolder?.valid) {
      const parentId = this.getParentFolder.value?.data?.id;
      const fileNameSplitted = this.fileUploaded.name.split('.');
      fileNameSplitted.splice(fileNameSplitted.length - 1, 1); //removing extension from title
      const fileName = fileNameSplitted.join('.');
      this.corpusStateService.uploadFile.next({ parentId: (parentId ? parentId : -1), resourceName: fileName, file: this.fileUploaded, uploader: this.uploaderForm.get('fileType')?.value ?? FileUploadType.PLAIN, splitLine: this.getSplitLine?.value ?? true });
    }
    else {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig(this.commonService.translateKey('CORPUS_EXPLORER.errorLoadingFile')));
    }

    this.visibleUploadFile = false;
  }

  /**
   * Method that submits the form of moving an item to the document system
   * @returns {void}
   */
  onSubmitMoveModal(): void {
    if (this.moveElementForm.invalid) {
      this.moveElementForm.markAllAsTouched();
      return;
    }

    if (this.selectedNode?.data?.id === this.getTargetFolder?.value?.data?.id) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(this.commonService.translateKey('CORPUS_EXPLORER.cannotMoveFolder').replace('${folderName}', (this.selectedNode?.label ?? ''))));
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
   * Method that submits form to rename a document element
   * @returns {void}
   */
  onSubmitRenameModal(): void {
    if (this.renameElementForm.invalid) {
      this.renameElementForm.markAllAsTouched();
      return;
    }

    const newName = this.getNewName?.value;

    if (!newName) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(this.commonService.translateKey('CORPUS_EXPLORER.newNameMissing')));
      return;
    }

    if (newName === this.selectedNode?.label) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(this.commonService.translateKey('CORPUS_EXPLORER.newNameEquals')));
      return;
    }
    const elementType = this.selectedNode!.data!.type;
    const elementId = this.selectedNode!.data!.id;
    this.corpusStateService.renameElement.next({ elementType: elementType, elementId: elementId, newName: newName });
    if (this.selectedNode && this.selectedNode.data) {
      this.selectedNode.label = newName;
      this.selectedNode.data.name = newName;
    }
    this.visibleRename = false;

  }

  /**
   * Method that handles the opening of the context menu
   * @param event {{ originalEvent: PointerEvent, node: TreeNode<CorpusElement> }} event right clicking on a tree node
   */
  onOpenContextMenu(event: { originalEvent: PointerEvent, node: TreeNode<CorpusElement> }) {
    this.generateContextMenu(event.node);
  }

  /**Method that reloads the file system */
  reload(): void {
    this.corpusStateService.refreshFileSystem.next(null);
    this.selectedNode = undefined;
  }

  /**Method that handles the display of the add folder form */
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

  /**Method that handles the display of the delete confirmation popup for a document item */
  showDeleteModal(): void {
    if (this.selectedNode && this.selectedNode.data) {
      const element_id = this.selectedNode.data.id;
      const name = this.selectedNode.label || "";
      const type = this.selectedNode.data.type;
      const confirmMsg = this.commonService.translateKey('CORPUS_EXPLORER.deleteMsg').replace('${elementName}', name);
      this.popupDeleteItem.confirmMessage = confirmMsg;

      this.popupDeleteItem.showDeleteConfirm(() => this.deleteElement(element_id, type), element_id, type);
    }
  }

  /**Method that handles the display of the modal shift of a document element */
  showMoveModal(): void {
    this.moveElementForm.reset();
    this.folders$ = this.files$.pipe(
      switchMap(nodes => of(this.mapToOnlyFolders(nodes))),
    );
    this.visibleMove = true;
  }

  /**Method that handles the modal display to rename a document element */
  showRenameModal(): void {
    this.renameElementForm.reset();

    if (this.selectedNode?.label) {
      this.setNewName = this.selectedNode.label;
    }

    this.visibleRename = true;
  }

  /**Method that handles the display of the loading modal of a new file */
  showUploadFileModal(): void {
    this.uploaderForm.reset();
    this.folders$ = this.files$.pipe(
      switchMap(nodes => of(this.mapToOnlyFolders(nodes))),
    );
    if (this.selectedNode?.data?.type === ElementType.FOLDER) {
      this.setParentFolder = this.selectedNode;
    }
    this.visibleUploadFile = true;
    this.setSplitLine = true;
    this.uploaderForm.get('fileType')?.setValue(FileUploadType.PLAIN);
  }

  /**
   * Method that maps the entire corpus element tree to its folder type elements only
   * @param nodes {TreeNode<CorpusElement>[]} List of tree nodes representing the corpus
   * @returns {TreeNode<CorpusElement>[]} List of tree nodes representing folders in the corpus
   */
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

  /**
   * Method that maps a list of corpus elements to a list of tree nodes
   * @param elements {CorpusElement[]} list of corpus elements
   * @returns {TreeNode<CorpusElement>[]} List of corpus elements as nodes in a tree
   */
  private mapToTreeNodes(elements: CorpusElement[]): TreeNode<CorpusElement>[] {
    const result: TreeNode<CorpusElement>[] = [];
    elements.forEach(element => {
      result.push(this.mapToTreeNode(element));
    });
    return result;
  }

  /**
   * Method that maps a corpus element to a tree node representing it
   * @param element {CorpusElement} single element of the corpus
   * @returns {TreeNode<CorpusElement>} Single tree node representing an element of the corpus
   */
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
   * Method that produces the custom context menu
   * @param node {TreeNode} Document tree node on which the click occurred
   * @returns {void}
   */
  private generateContextMenu(node: TreeNode<CorpusElement>): void {
    const menuAddFolder = {
      label: this.commonService.translateKey('CORPUS_EXPLORER.addFolderTitle'),
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
        label: this.commonService.translateKey('CORPUS_EXPLORER.moveTitle'),
        icon: 'fa-solid fa-sync',
        command: (event: any) => {
          this.showMoveModal()
        }
      },
      {
        label: this.commonService.translateKey('CORPUS_EXPLORER.deleteBtn'),
        icon: 'pi pi-trash',
        command: (event: any) => {
          this.showDeleteModal()
        }
      }
    ]);

    const menuRename = {
      label: this.commonService.translateKey('CORPUS_EXPLORER.renameTitle'),
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
   * Method that marks form fields as touched and reports failure to load
   */
  private saveUploadFileWithFormErrors(): void {
    this.uploaderForm.markAllAsTouched();

    if (!this.fileUploaded) {
      this.isFileUploaded = false;
      this.isFileUploaderTouched = true;
    }
  }
}
