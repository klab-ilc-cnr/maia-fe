import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { DocumentElement } from './../../model/tileContent/document-element';
import { DocumentType } from './../../model/tileContent/document-type';
import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MenuItem, MessageService, TreeDragDropService, TreeNode } from 'primeng/api';
import { WorkspaceService } from 'src/app/services/workspace.service';
import { NgForm } from '@angular/forms';

declare var $: any;

@Component({
  selector: 'app-workspace-corpus-explorer',
  //providers: [TreeDragDropService],
  templateUrl: './workspace-corpus-explorer.component.html',
  styleUrls: ['./workspace-corpus-explorer.component.scss']
})
export class WorkspaceCorpusExplorerComponent implements OnInit {

  @Output() onTextSelectEvent = new EventEmitter<any>();

  files: TreeNode<DocumentElement>[] = [];
  fileUploaded: any = undefined;
  foldersAvailableToAddFolder: TreeNode<DocumentElement>[] = [];
  foldersAvailableToFileUpload: TreeNode<DocumentElement>[] = [];
  foldersAvailableToMoveElementIn: TreeNode<DocumentElement>[] = [];
  isFileSizeExceed: boolean = false;
  isFileUploaded: boolean = false;
  isFileUploaderTouched: boolean = false;
  isMovingToTrash: boolean = true;
  items: MenuItem[] = [];
  loading: boolean = false;
  newFolderName: string | undefined;
  newName: string | undefined;
  selectedDocument: TreeNode<DocumentElement> | undefined;
  selectedFolderNode: TreeNode<DocumentElement> | undefined;

  @ViewChild('fileUploader') public fileUploader!: ElementRef;

  @ViewChild('addFolderForm') public addFolderForm!: NgForm;
  @ViewChild('fileUploaderForm') public fileUploaderForm!: NgForm;
  @ViewChild('moveForm') public moveForm!: NgForm;
  @ViewChild('renameForm') public renameForm!: NgForm;

  // PER MOCK
  rawData: any;
  private clickCount = 0;

  constructor(
    private workspaceService: WorkspaceService,
    private messageService: MessageService,
  ) { }

  ngOnInit(): void {
    this.updateDocumentSystem()
  }

  public get shouldBeDisabledA(): boolean {
    if (this.selectedDocument) {
      if (this.selectedDocument.data?.path?.includes('trash')) {
        return true;
      }
      else {
        return false;
      }
    }

    return false;
  };

  public get shouldBeDisabledMD(): boolean {
    if (this.selectedDocument) {
      if (this.selectedDocument.data?.type == 'trash' || this.selectedDocument.label == "Corpus") {
        return true;
      }
      else {
        return false;
      }
    }

    return true;
  };

  public get shouldBeDisabledR(): boolean {
    if (this.selectedDocument) {
      if (this.selectedDocument.data?.path?.includes('trash') || this.selectedDocument.label == "Corpus") {
        return true;
      }
      else {
        return false;
      }
    }

    return true;
  };

  public get shouldBeDisabledU(): boolean {
    if (this.selectedDocument) {
      if (this.selectedDocument.data?.path?.includes('trash')  || this.selectedDocument.label == "Corpus") {
        return true;
      }
      else {
        return false;
      }
    }

    return false;
  };

  nodeSelect(event: any): void {
    console.log(event)
    this.clickCount++;
    // this.selectedDocument = event.node;
    setTimeout(() => {
      if (this.clickCount === 1) {
        // single
      } else if (this.clickCount === 2) {
        // double
        if (event.node.data?.type == DocumentType.File) {
          this.onTextSelectEvent.emit(event)
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

    this.workspaceService.addFolder(element_id).subscribe({
      next: (result) => {
        console.log(result, result['response-status'], result?.['response-status'] )
        if (result['response-status'] == 0) {
          let newId = result.node['element-id']

          this.workspaceService.renameElement(newId, name, DocumentType.Directory).subscribe({
            next: (result) => {
              if (result.responseStatus == 0) {
                this.messageService.add(this.generateSuccessMessageConfig('Cartella \'' + name + '\' creata con successo'));
              }
              else {
                this.workspaceService.removeElement(newId, DocumentType.Directory).subscribe({
                  next: (result) => {
                    this.messageService.add(this.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''))
                  },
                  error: () => {
                    this.messageService.add(this.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''))
                  }
                })
              }
            },
            error: () => {
              this.messageService.add(this.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''))
            },
            complete: () => {
              $('#addFolderModal').modal('hide')

              this.updateDocumentSystem();
            }
          })
        }
        else if (result['response-status'] == 1) {
          this.messageService.add(this.generateErrorMessageConfig('Utente non autorizzato'))
          $('#addFolderModal').modal('hide')
        }
        else {
          this.messageService.add(this.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''))
          $('#addFolderModal').modal('hide')
        }
      },
      error: (err) => {
        this.messageService.add(this.generateErrorMessageConfig('Errore nella creazione della cartella \'' + name + '\''))
        $('#addFolderModal').modal('hide')
      },
      complete: () => {
        $('#addFolderModal').modal('hide')

        this.updateDocumentSystem();
      }
    })
    // console.log("Add  ", this.addFolderForm.form.value)
    // console.log("Add folder ", this.newFolderName, " into ", this.selectedFolderNode)

    // if (this.selectedFolderNode) {
    //   var folder = this.searchDocByElementId(this.rawData, this.selectedFolderNode.data)

    //   var element_id = folder.children ? folder.children.length : 0;

    //   let newFolderNode = {
    //     path: folder.path + "/" + this.newFolderName?.toLowerCase(),
    //     name: this.newFolderName,
    //     type: DocumentType.Directory,
    //     'element-id': folder['element-id'] + element_id + 1,
    //     metadata: {},
    //     children: []
    //   }

    //   folder.children.unshift(newFolderNode);

    //   this.updateDocumentSystem()

    //   //this.resetAddFolderForm()
    // }

    $('#addFolderModal').modal('hide')
  }

  onSubmitDeleteModal(): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Errore',
      detail: 'Non esisto ancora le api per la moveToTrash',
      life: 10000
    })

    console.log("elimino ", this.selectedDocument)
    // MOCKATA
    // if (this.selectedDocument) {
    //   if (this.selectedDocument.data?.path?.includes('trash')) {
    //     var nodeToDelete = this.searchDocByElementId(this.rawData, this.selectedDocument.data)

    //     var originalPath = JSON.parse(JSON.stringify(nodeToDelete.path));
    //     originalPath = originalPath.split("/" + nodeToDelete.name.toLowerCase())[0]

    //     var originalFolder = this.searchDocByPath(this.rawData, originalPath)

    //     var i = originalFolder.children.findIndex((c:any) => c['element-id'] === nodeToDelete['element-id'])
    //     originalFolder.children.splice(i, 1)
    //   }
    //   else {
    //     var nodeToMove = this.searchDocByElementId(this.rawData, this.selectedDocument.data)
    //     var folder = this.searchDocByPath(this.rawData, "corpus/trash")

    //     var originalPath = JSON.parse(JSON.stringify(nodeToMove.path));
    //     originalPath = originalPath.split("/" + nodeToMove.name.toLowerCase())[0]

    //     var originalFolder = this.searchDocByPath(this.rawData, originalPath)

    //     console.log (nodeToMove, originalFolder)

    //     this.updatePaths(nodeToMove, folder.path)

    //     folder.children.unshift(nodeToMove);
    //     var i = originalFolder.children.findIndex((c:any) => c['element-id'] === nodeToMove['element-id'])
    //     originalFolder.children.splice(i, 1)
    //   }

    //   this.updateDocumentSystem()
    // }
    // MOCKATA
    $('#deleteModal').modal('hide')
  }

  onSubmitFileUploaderModal(): void {
    if (this.fileUploaderForm.invalid || !this.fileUploaded) {
      return this.saveUploadFileWithFormErrors();
    }

    console.log("upload ", this.fileUploaded, " into ", this.selectedFolderNode)
    console.log(this.fileUploaderForm)

    if (this.fileUploaded && this.selectedFolderNode) {
      let element_id = this.fileUploaderForm.form.value.folderToUpload.data["element-id"]
      let name = this.fileUploaded.name
      let folderName = this.fileUploaderForm.form.value.folderToUpload.data.name

      let errorMsg = 'Errore nel caricare il file \'' + name + '\' in \'' + folderName + '\''
      let successMsg = 'File \'' + name + '\' caricato con successo in \'' + folderName + '\''

      this.workspaceService.uploadFile(element_id, this.fileUploaded).subscribe({
        next: (result) => {
          if (result['response-status'] == 0) {
            this.messageService.add(this.generateSuccessMessageConfig(successMsg));
          }
          else if (result['response-status'] == 1) {
            this.messageService.add(this.generateErrorMessageConfig('Utente non autorizzato'))
          }
          else {
            this.messageService.add(this.generateErrorMessageConfig(errorMsg))
          }
        },
        error: () => {
          this.messageService.add(this.generateErrorMessageConfig(errorMsg))
        },
        complete: () => {
          this.updateDocumentSystem();
        }
      })
    }
    else {
      this.messageService.add(this.generateErrorMessageConfig("Errore nell'operazione di caricamento file"))
    }

    $('#uploadFileModal').modal('hide')

    // this.loaderService.show();
    // this.workspaceService.uploadFile()
    //     .subscribe({
    //         next: () => {
    //             this.loaderService.hide();
    //             this.backToList();
    //             this.alertService.success(this.createSuccessMessage);
    //         },
    //         error: (err: string | Error) => {
    //             this.loaderService.hide();
    //             this.alertService.error(err)
    //         }
    //     });
  }

  onSubmitMoveModal(): void {
    if (this.moveForm.invalid) {
      this.moveForm.form.markAllAsTouched();
      return ;
    }

    if (this.selectedDocument && this.selectedDocument.data) {
      let element_id = this.selectedDocument.data['element-id']
      let name = this.selectedDocument.data.name
      let newParentName = this.moveForm.form.value.folderToMoveIn.data.name
      let target_id = this.moveForm.form.value.folderToMoveIn.data["element-id"]
      let type = this.selectedDocument.data.type

      let errorMsg = 'Errore nello spostare la cartella \'' + name + '\' in \'' + newParentName + '\''
      let successMsg = 'Cartella \'' + name + '\' spostata con successo'

      if (type == DocumentType.File) {
        errorMsg = 'Errore nello spostare il file \'' + name + '\' in \'' + newParentName + '\''
        successMsg = 'File \'' + name + '\' spostato con successo'
      }

      this.workspaceService.moveElement(element_id, target_id, type).subscribe({
        next: (result) => {
          if (result.responseStatus == 0) {
            this.messageService.add(this.generateSuccessMessageConfig(successMsg));
          }
          else if (result.responseStatus == 1) {
            this.messageService.add(this.generateErrorMessageConfig('Utente non autorizzato'))
          }
          else {
            this.messageService.add(this.generateErrorMessageConfig(errorMsg))
          }
        },
        error: () => {
          this.messageService.add(this.generateErrorMessageConfig(errorMsg))
        },
        complete: () => {
          this.updateDocumentSystem();
        }
      })
    }
    else {
      this.messageService.add(this.generateErrorMessageConfig("Errore nell'operazione di spostamento"))
    }

    $('#moveModal').modal('hide')

    // if (this.selectedDocument && this.selectedFolderNode) {
    //   var nodeToMove = this.searchDocByElementId(this.rawData, this.selectedDocument.data)
    //   var folder = this.searchDocByElementId(this.rawData, this.selectedFolderNode.data)

    //   var originalPath = JSON.parse(JSON.stringify(nodeToMove.path));
    //   originalPath = originalPath.split("/" + nodeToMove.name.toLowerCase())[0]

    //   var originalFolder = this.searchDocByPath(this.rawData, originalPath)

    //   console.log (nodeToMove, originalFolder)

    //   this.updatePaths(nodeToMove, folder.path)

    //   folder.children.unshift(nodeToMove);
    //   var i = originalFolder.children.findIndex((c:any) => c['element-id'] === nodeToMove['element-id'])
    //   originalFolder.children.splice(i, 1)

    //   this.updateDocumentSystem()

    //   $('#moveModal').modal('hide')
    //   this.resetMoveForm()
    // }

    // this.loaderService.show();
    // this.workspaceService.uploadFile()
    //     .subscribe({
    //         next: () => {
    //             this.loaderService.hide();
    //             this.backToList();
    //             this.alertService.success(this.createSuccessMessage);
    //         },
    //         error: (err: string | Error) => {
    //             this.loaderService.hide();
    //             this.alertService.error(err)
    //         }
    //     });
  }

  onSubmitRenameModal(): void {
    if (this.renameForm.invalid) {
      this.renameForm.form.markAllAsTouched();
      return ;
    }

    console.log("Rename ", this.selectedDocument, " into ", this.newName)
    console.log("rr", this.renameForm)

    if (this.selectedDocument && this.selectedDocument.data) {
      let element_id = this.selectedDocument.data['element-id']
      let newName = this.renameForm.form.value.newElementName
      let oldName = this.selectedDocument.data.name
      let type = this.selectedDocument.data.type

      let errorMsg = 'Errore nel rinominare la cartella \'' + oldName + '\' in \'' + newName + '\''
      let successMsg = 'Cartella \'' + newName + '\' rinominata con successo'

      if (type == DocumentType.File) {
        errorMsg = 'Errore nel rinominare il file \'' + oldName + '\' in \'' + newName + '\''
        successMsg = 'File \'' + newName + '\' rinominato con successo'
      }

      this.workspaceService.renameElement(element_id, newName, type).subscribe({
        next: (result) => {
          if (result.responseStatus == 0) {
            this.messageService.add(this.generateSuccessMessageConfig(successMsg));
          }
          else if (result.responseStatus == 1) {
            this.messageService.add(this.generateErrorMessageConfig('Utente non autorizzato'))
          }
          else {
            this.messageService.add(this.generateErrorMessageConfig(errorMsg))
          }
        },
        error: () => {
          this.messageService.add(this.generateErrorMessageConfig(errorMsg))
        },
        complete: () => {
          this.updateDocumentSystem();
        }
      })
    }
    else {
      this.messageService.add(this.generateErrorMessageConfig("Errore nell'operazione di rinominazione"))
    }

    $('#renameModal').modal('hide')

    // if (this.selectedDocument && this.newName) {
      // var node = this.searchDocByElementId(this.rawData, this.selectedDocument.data)
      // console.log (node)
      // node.path = node.path.replace(node.name.toLowerCase(), this.newName.toLowerCase())
      // node.name = this.newName;

      // console.log("dopo", node)
      // this.updateDocumentSystem()

      // $('#renameModal').modal('hide')
      // this.resetRenameForm()
    // }
    // this.loaderService.show();
    // this.workspaceService.uploadFile()
    //     .subscribe({
    //         next: () => {
    //             this.loaderService.hide();
    //             this.backToList();
    //             this.alertService.success(this.createSuccessMessage);
    //         },
    //         error: (err: string | Error) => {
    //             this.loaderService.hide();
    //             this.alertService.error(err)
    //         }
    //     });
  }

  onTreeContextMenuSelect(event: any, cm: ContextMenu): void {
    if (event.node.data.type == DocumentType.Trash) {
      console.log("hide")
      cm.hide()
      return
    }

    console.log('menu', event.node)

    this.generateContextMenu(event.node)
  }

  showAddFolderModal(): void {
    this.resetAddFolderForm();

    if (this.selectedDocument && this.selectedDocument.data?.type == DocumentType.Directory) {
      var node = this.searchNodeByElementId(this.foldersAvailableToAddFolder, this.selectedDocument)

      if (node) {
        this.selectedFolderNode = node;
      }
    }

    $('#addFolderModal').appendTo('body').modal('show');
  }

  showDeleteModal(): void {
    if (this.selectedDocument) {
      if (this.selectedDocument.data?.path?.includes('trash')) {
        this.isMovingToTrash = false;
      }
      else {
        this.isMovingToTrash = true;
      }

      $('#deleteModal').appendTo('body').modal('show');
    }
  }

  showMoveModal(): void {
    this.resetMoveForm();

    this.foldersAvailableToMoveElementIn = [];

    if (this.selectedDocument) {
      if (this.selectedDocument.data?.type == DocumentType.Directory){
        this.foldersAvailableToMoveElementIn = this.foldersAvailableToAddFolder
      }
      else {
        this.foldersAvailableToMoveElementIn = this.foldersAvailableToFileUpload
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

    if (this.selectedDocument && this.selectedDocument.data?.type == DocumentType.Directory) {
      var node = this.searchNodeByElementId(this.foldersAvailableToFileUpload, this.selectedDocument)

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
      node.children =  this.documentsToTreeNodes(doc.children)
    }

    if (doc.type == DocumentType.Directory) {
      node.expandedIcon = "pi pi-folder-open"
      node.collapsedIcon = "pi pi-folder"
    }
    else if (doc.type == DocumentType.File) {
      node.icon = "pi pi-file"
      node.leaf = true
    }

    if (doc.type == DocumentType.Trash) {
      node.icon = "pi pi-trash"
      node.styleClass = "text-danger"
      node.selectable = false
      node.draggable = false
      node.droppable = true
    }
    else {
      node.draggable = true
      node.droppable = true
    }

    node.label = doc.name
    node.data = doc

    return node;
  }

  private generateContextMenu(node: TreeNode): void {
    if (node.data.type == DocumentType.Trash) {
      this.items = []
      return;
    }

    var menuAddFolder = {
      label: 'Aggiungi cartella',
      icon: 'fa-solid fa-folder-plus',
      command: (event: any) => {
        console.log("aggiungi cartella", this.selectedDocument)
        this.showAddFolderModal()
      }
    }

    if (node.data.name == "Corpus") {
      this.items = [menuAddFolder]
      return;
    }

    let cmItems = [
      {
        label: 'Sposta',
        icon: 'fa-solid fa-sync',
        command: (event: any) => {
          console.log("sposta", this.selectedDocument)
          this.showMoveModal()
        }
      },
      {
        label: 'Elimina',
        icon: 'pi pi-trash',
        command: (event: any) => {
          console.log("elimina", this.selectedDocument)
          this.showDeleteModal()
        }
      }
    ];

    if (node.data.path.includes('trash')) {
      this.items = cmItems;
      return;
    }

    let menuRename = {
      label: 'Rinomina',
      icon: 'fa-solid fa-pen',
      command: (event: any) => {
        console.log("rinomina", this.selectedDocument)
        this.showRenameModal()
      }
    }

    cmItems.unshift(menuRename)

    if (node.data.type == DocumentType.Directory) {
      cmItems.unshift(menuAddFolder)
    }

    this.items = cmItems;
  }

  private generateErrorMessageConfig(msg: string): any {
    return {
      severity: 'error',
      summary: 'Errore',
      detail: msg,
      life: 3000
    }
  }

  private generateSuccessMessageConfig(msg: string): any {
    return {
      severity: 'success',
      summary: 'Successo',
      detail: msg,
      life: 3000
    }
  }

  private omitFilesAndTrash(docs: any[]) {
    var dataParsed: TreeNode<any>[] = [];

    docs.forEach((obj) => {
      if (obj.data.type != DocumentType.Trash && obj.data.type != DocumentType.File) {
        obj.children = this.omitFilesAndTrash(obj.children)
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

  private searchNodeByElementId(source: any[], element: any): any {
    for (let el of source) {
      if (el.data?.['element-id'] == element.data?.['element-id']) {
        return el;
      }

      if (el.children && el.children != []) {
        let node = this.searchNodeByElementId(el.children, element);

        if (node) {
          return node;
        }
      }
    }

    return undefined;
  }

  // PER MOCK
  private searchDocByElementId(source: any[], element: any): any {
    for (let el of source) {
      if (el['element-id'] == element['element-id']) {
        return el;
      }

      if (el.children && el.children.length != 0) {
        let doc = this.searchDocByElementId(el.children, element);

        if (doc) {
          return doc;
        }
      }
    }

    return undefined;
  }

  private searchDocByPath(source: any[], path: any): any {
    for (let el of source) {
      if (el.path == path) {
        return el;
      }

      if (el.children && el.children.length != 0) {
        let doc = this.searchDocByPath(el.children, path);

        if (doc) {
          return doc;
        }
      }
    }

    return undefined;
  }

  private updatePaths(source: any, path: any) {
    source.path = path + '/' + source.name.toLowerCase()

    if (source.children && source.children.length != 0) {
      source.children.forEach((c:any) => {
        this.updatePaths(c, source.path)
      })
    }
  }

  // FINE MOCK

  // DA AGGIORNARE CON L'ALLACCIAMENTO DEI SERVIZI DI CASH SERVER
  private updateDocumentSystem() {
    // Qui andrà inserita anche la chiamata al BE per recuperare il document system
    this.workspaceService.retrieveCorpus().subscribe({
      next: (data) => {
        console.log('qui', data)

        if (data.documentSystem) {
          this.rawData = JSON.parse(JSON.stringify(data.documentSystem))
          let rootNode = {
            path: "/root/",
            name: "Corpus",
            type: DocumentType.Directory,
            'element-id': 0,
            metadata: {},
            children: this.rawData
          }

          let fileTree = [];
          fileTree.push(rootNode)

          this.files = this.documentsToTreeNodes(fileTree)

          if (this.files.length > 0) {
            this.files[0].expanded = true;
            this.files[0].draggable = false;
            this.files[0].droppable = true;
          }

          var filesDeepCopy = JSON.parse(JSON.stringify(this.files))

          var docSystemWithoutFiles = this.omitFilesAndTrash(filesDeepCopy);
          this.foldersAvailableToAddFolder = JSON.parse(JSON.stringify(docSystemWithoutFiles))

          if (docSystemWithoutFiles.length > 0) {
            docSystemWithoutFiles[0].selectable = false;
          }

          this.foldersAvailableToFileUpload = docSystemWithoutFiles
        }
      }
    })
  }
}
