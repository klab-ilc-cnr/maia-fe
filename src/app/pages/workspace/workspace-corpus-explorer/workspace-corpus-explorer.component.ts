import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { ContextMenu } from 'primeng/contextmenu';
import { DocumentElement } from 'src/app/models/corpus/document-element';
import { ElementType } from 'src/app/models/corpus/element-type';
import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MenuItem, MessageService, TreeNode } from 'primeng/api';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { NgForm } from '@angular/forms';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import Swal from 'sweetalert2';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { LoaderService } from 'src/app/services/loader.service';
import { Roles } from 'src/app/models/roles';

declare var $: any;

@Component({
  selector: 'app-workspace-corpus-explorer',
  templateUrl: './workspace-corpus-explorer.component.html',
  styleUrls: ['./workspace-corpus-explorer.component.scss']
})
export class WorkspaceCorpusExplorerComponent implements OnInit {
  private deleteElement = (id: number, name: string, type: ElementType): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare la cartella \'' + name + '\'';
    let successMsg = 'Cartella \'' + name + '\' eliminata con successo';

    if (type == ElementType.File) {
      errorMsg = 'Errore nell\'eliminare il file \'' + name + '\'';
      successMsg = 'File \'' + name + '\' eliminato con successo';
    }

    this.workspaceService
        .removeElement(id, type)
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

  @Output() onTextSelectEvent = new EventEmitter<any>();

  private clickCount = 0;

  public get shouldDeleteBeDisplayed(): boolean {
    return this.loggedUserService.currentUser?.role == Roles.AMMINISTRATORE;
  };

  public get shouldRMBeDisabled(): boolean {
    if (this.selectedDocument) {
      if (this.selectedDocument.label == "Corpus") {
        return true;
      }
      else {
        return false;
      }
    }

    return true;
  };

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

  files: TreeNode<DocumentElement>[] = [];
  fileUploaded: any = undefined;
  foldersAvailableToAddFolder: TreeNode<DocumentElement>[] = [];
  foldersAvailableToFileUpload: TreeNode<DocumentElement>[] = [];
  foldersAvailableToMoveElementIn: TreeNode<DocumentElement>[] = [];
  isFileSizeExceed: boolean = false;
  isFileUploaded: boolean = false;
  isFileUploaderTouched: boolean = false;
  items: MenuItem[] = [];
  loading: boolean = false;
  newFolderName: string | undefined;
  newName: string | undefined;
  rawData: any;
  selectedDocument: TreeNode<DocumentElement> | undefined;
  selectedFolderNode: TreeNode<DocumentElement> | undefined;

  @ViewChild('fileUploader') public fileUploader!: ElementRef;
  @ViewChild('tree') public tree: any;

  @ViewChild('addFolderForm') public addFolderForm!: NgForm;
  @ViewChild('fileUploaderForm') public fileUploaderForm!: NgForm;
  @ViewChild('moveForm') public moveForm!: NgForm;
  @ViewChild('renameForm') public renameForm!: NgForm;

  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  constructor(
    private loggedUserService : LoggedUserService,
    private workspaceService: WorkspaceService,
    private loaderService: LoaderService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  ngOnInit(): void {
    this.updateDocumentSystem()
  }

  ngOnDestroy(): void {
    Swal.close();
  }

  nodeSelect(event: any): void {
    this.clickCount++;

    setTimeout(() => {
      if (this.clickCount === 1) {
      } else if (this.clickCount === 2) {
        if (event.node.data?.type == ElementType.File) {
          this.onTextSelectEvent.emit(event)
        }
        else if (event.node.data?.type == ElementType.Directory) {
          event.node.expanded = !event.node.expanded;
        }
      }
      this.clickCount = 0;
    }, 250)
  }

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

  onFileUploaderTouch(): void {
    this.isFileUploaderTouched = true;
  }

  onSubmitAddFolderModal(): void {
    if (this.addFolderForm.invalid) {
      this.addFolderForm.form.markAllAsTouched();
      return ;
    }

    let element_id = this.addFolderForm.form.value.folderToAdd.data?.['element-id'];
    let name = this.addFolderForm.form.value.nfName;

    this.loaderService.show();
    this.workspaceService.addFolder(element_id).subscribe({
      next: (result) => {
        if (result['response-status'] == 0) {
          let newId = result.node['element-id'];

          this.workspaceService.renameElement(newId, name, ElementType.Directory).subscribe({
            next: (result) => {
              $('#addFolderModal').modal('hide');

              if (result.responseStatus == 0) {
                this.messageService.add(this.msgConfService.generateSuccessMessageConfig('Cartella \'' + name + '\' creata con successo'));
              }
              else {
                this.workspaceService.removeElement(newId, ElementType.Directory).subscribe({
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
              this.messageService.add(this.msgConfService.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''));
              this.loaderService.hide();
            }
          })
        }
        else if (result['response-status'] == 1) {
          $('#addFolderModal').modal('hide');
          this.messageService.add(this.msgConfService.generateErrorMessageConfig('Utente non autorizzato'));
        }
        else {
          $('#addFolderModal').modal('hide');
          this.messageService.add(this.msgConfService.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''));
        }

        $('#addFolderModal').modal('hide');

        this.updateDocumentSystem();
      },
      error: (err) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''));
        $('#addFolderModal').modal('hide');
      }
    })

    $('#addFolderModal').modal('hide');
  }

  onSubmitFileUploaderModal(): void {
    if (this.fileUploaderForm.invalid || !this.fileUploaded) {
      return this.saveUploadFileWithFormErrors();
    }

    if (this.fileUploaded && this.selectedFolderNode) {
      let element_id = this.fileUploaderForm.form.value.folderToUpload.data["element-id"];
      let name = this.fileUploaded.name;
      let folderName = this.fileUploaderForm.form.value.folderToUpload.data.name;

      let errorMsg = 'Errore nel caricare il file \'' + name + '\' in \'' + folderName + '\'';
      let successMsg = 'File \'' + name + '\' caricato con successo in \'' + folderName + '\'';

      this.loaderService.show();
      this.workspaceService.uploadFile(element_id, this.fileUploaded).subscribe({
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
          this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
          this.loaderService.hide();
        }
      })
    }
    else {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore nell'operazione di caricamento file"));
    }

    $('#uploadFileModal').modal('hide');
  }

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

      if (type == ElementType.File) {
        errorMsg = 'Errore nello spostare il file \'' + name + '\' in \'' + newParentName + '\'';
        successMsg = 'File \'' + name + '\' spostato con successo';
      }

      this.loaderService.show();
      this.workspaceService.moveElement(element_id, target_id, type).subscribe({
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
          this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
          this.loaderService.hide();
        }
      })
    }
    else {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore nell'operazione di spostamento"));
    }

    $('#moveModal').modal('hide');
  }

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

      if (type == ElementType.File) {
        errorMsg = 'Errore nel rinominare il file \'' + oldName + '\' in \'' + newName + '\'';
        successMsg = 'File \'' + newName + '\' rinominato con successo';
      }

      this.loaderService.show();
      this.workspaceService.renameElement(element_id, newName, type).subscribe({
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
          this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
          this.loaderService.hide();
        }
      })
    }
    else {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore nell'operazione di rinominazione"));
    }

    $('#renameModal').modal('hide');
  }

  onTreeContextMenuSelect(event: any, cm: ContextMenu): void {
    this.generateContextMenu(event.node);
  }

  reload(): void {
    this.updateDocumentSystem();
  }

  showAddFolderModal(): void {
    this.resetAddFolderForm();

    if (this.selectedDocument && this.selectedDocument.data?.type == ElementType.Directory) {
      var node = this.searchNodeByElementId(this.foldersAvailableToAddFolder, this.selectedDocument);

      if (node) {
        this.selectedFolderNode = node;
      }
    }

    $('#addFolderModal').appendTo('body').modal('show');
  }

  showDeleteModal(): void {
    if (this.selectedDocument && this.selectedDocument.data) {
      let element_id = this.selectedDocument.data['element-id'];
      let name = this.selectedDocument.data.name || "";
      let type = this.selectedDocument.data.type;

      let confirmMsg = 'Stai per cancellare la cartella \'' + name + '\'';

      if (type == ElementType.File) {
        confirmMsg = 'Stai per cancellare il file \'' + name + '\'';
      }

      this.popupDeleteItem.confirmMessage = confirmMsg;

      this.popupDeleteItem.showDeleteConfirm(() => this.deleteElement(element_id, name, type), element_id, name, type);
    }
  }

  showMoveModal(): void {
    this.resetMoveForm();

    this.foldersAvailableToMoveElementIn = [];

    if (this.selectedDocument) {
      if (this.selectedDocument.data?.type == ElementType.Directory){
        this.foldersAvailableToMoveElementIn = this.foldersAvailableToAddFolder;
      }
      else {
        this.foldersAvailableToMoveElementIn = this.foldersAvailableToFileUpload;
      }
    }

    $('#moveModal').appendTo('body').modal('show');
  }

  showRenameModal(): void {
    this.resetRenameForm();

    if (this.selectedDocument) {
      this.newName = this.selectedDocument?.label;
    }

    $('#renameModal').appendTo('body').modal('show');
  }

  showUploadFileModal(): void {
    this.resetFileUploaderForm();

    if (this.selectedDocument && this.selectedDocument.data?.type == ElementType.Directory) {
      var node = this.searchNodeByElementId(this.foldersAvailableToFileUpload, this.selectedDocument);

      if (node) {
        this.selectedFolderNode = node;
      }
    }

    $('#uploadFileModal').appendTo('body').modal('show');
  }

  private documentsToTreeNodes(docs: DocumentElement[]) {
    var dataParsed = [];

    for (let d of docs) {
      dataParsed.push(this.documentToTreeNode(d));
    }

    return dataParsed;
  }

  private documentToTreeNode(doc: DocumentElement): TreeNode {
    var node: TreeNode<DocumentElement> = {};

    if (doc.children) {
      node.children =  this.documentsToTreeNodes(doc.children);
    }

    if (doc.type == ElementType.Directory) {
      node.expandedIcon = "pi pi-folder-open";
      node.collapsedIcon = "pi pi-folder";
    }
    else if (doc.type == ElementType.File) {
      node.icon = "pi pi-file";
      node.leaf = true;
    }

    node.label = doc.name;
    node.data = doc;

    return node;
  }

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

    if (node.data.type == ElementType.Directory) {
      cmItems.unshift(menuAddFolder);
    }

    this.items = cmItems;
  }

  private omitFiles(docs: any[]) {
    var dataParsed: TreeNode<any>[] = [];

    docs.forEach((obj) => {
      if (obj.data.type != ElementType.File) {
        obj.children = this.omitFiles(obj.children);
        dataParsed.push(obj);
      }
    })

    return dataParsed;
  }

  private resetAddFolderForm(): void {
    $('#addFolderForm').trigger("reset");

    this.selectedFolderNode = undefined;
  }

  private resetFileUploaderForm(): void {
    $('#fileUploaderForm').trigger("reset");

    this.isFileUploaded = false;
    this.isFileUploaderTouched = false;
    this.selectedFolderNode = undefined;
  }

  private resetMoveForm(): void {
    $('#moveForm').trigger("reset");

    this.selectedFolderNode = undefined;
  }

  private resetRenameForm(): void {
    $('#renameForm').trigger("reset");
  }

  private saveUploadFileWithFormErrors(): void {
    this.fileUploaderForm.form.markAllAsTouched();

    if (!this.fileUploaded) {
      this.isFileUploaded = false;
      this.isFileUploaderTouched = true;
    }
  }

  private showOperationFailed(errorMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: errorMessage,
      showConfirmButton: true
    });
  }

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

  private updateDocumentSystem() {
    this.loading = true;
    this.loaderService.show();

    this.workspaceService.retrieveCorpus().subscribe({
      next: (data) => {
        if (data.documentSystem) {
          this.rawData = JSON.parse(JSON.stringify(data.documentSystem))
          let rootNode = {
            path: "/root/",
            name: "Corpus",
            type: ElementType.Directory,
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
