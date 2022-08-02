import { ContextMenu, ContextMenuModule } from 'primeng/contextmenu';
import { DocumentElement } from './../../model/tileContent/document-element';
import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { MenuItem, TreeDragDropService, TreeNode } from 'primeng/api';
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
    private workspaceService: WorkspaceService
  ) { }

  ngOnInit(): void {
    // this.generateContextMenu()

    this.workspaceService.retrieveCorpus("1").subscribe({
      next: (data) => {
        console.log('qui', data)

        if (data.documentSystem) {
          this.rawData = JSON.parse(JSON.stringify(data.documentSystem))
          this.files = this.documentsToTreeNodes(data.documentSystem)

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

  nodeSelect(event: any): void {
    console.log(event)
    this.clickCount++;
    // this.selectedDocument = event.node;
    setTimeout(() => {
      if (this.clickCount === 1) {
        // single
      } else if (this.clickCount === 2) {
        // double
        if (event.node.data?.type == "file") {
          this.onTextSelectEvent.emit(event)
        }
      }
      this.clickCount = 0;
    }, 250)
  }

  // onClick(event: any) {
  //   if(event.srcElement.tagName === 'TD')
  //   {
  //     this.onTextSelectEvent.emit(event)
  //   }
  // }

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

    console.log("Add folder ", this.newFolderName, " into ", this.selectedFolderNode)

    if (this.selectedFolderNode) {
      var folder = this.searchDocByElementId(this.rawData, this.selectedFolderNode.data)

      var element_id = folder.children ? folder.children.length : 0;

      let newFolderNode = {
        path: folder.path + "/" + this.newFolderName?.toLowerCase(),
        name: this.newFolderName,
        type: "directory",
        'element-id': folder['element-id'] + element_id + 1,
        metadata: {},
        children: []
      }

      folder.children.unshift(newFolderNode);

      this.updateDocumentSystem()

      //this.resetAddFolderForm()
    }

    $('#addFolderModal').modal('hide')

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

  onSubmitDeleteModal(): void {
    console.log("elimino ", this.selectedDocument)
    if (this.selectedDocument) {
      if (this.selectedDocument.data?.path?.includes('trash')) {
        var nodeToDelete = this.searchDocByElementId(this.rawData, this.selectedDocument.data)

        var originalPath = JSON.parse(JSON.stringify(nodeToDelete.path));
        originalPath = originalPath.split("/" + nodeToDelete.name.toLowerCase())[0]

        var originalFolder = this.searchDocByPath(this.rawData, originalPath)

        var i = originalFolder.children.findIndex((c:any) => c['element-id'] === nodeToDelete['element-id'])
        originalFolder.children.splice(i, 1)
      }
      else {
        var nodeToMove = this.searchDocByElementId(this.rawData, this.selectedDocument.data)
        var folder = this.searchDocByPath(this.rawData, "corpus/trash")

        var originalPath = JSON.parse(JSON.stringify(nodeToMove.path));
        originalPath = originalPath.split("/" + nodeToMove.name.toLowerCase())[0]

        var originalFolder = this.searchDocByPath(this.rawData, originalPath)

        console.log (nodeToMove, originalFolder)

        this.updatePaths(nodeToMove, folder.path)

        folder.children.unshift(nodeToMove);
        var i = originalFolder.children.findIndex((c:any) => c['element-id'] === nodeToMove['element-id'])
        originalFolder.children.splice(i, 1)
      }

      this.updateDocumentSystem()
    }
    $('#deleteModal').modal('hide')
  }

  onSubmitFileUploaderModal(): void {
    if (this.fileUploaderForm.invalid || !this.fileUploaded) {
      return this.saveUploadFileWithFormErrors();
    }

    console.log("upload ", this.fileUploaded, " into ", this.selectedFolderNode)

    if (this.fileUploaded && this.selectedFolderNode) {
      var folder = this.searchDocByElementId(this.rawData, this.selectedFolderNode.data)

      var element_id = folder.children ? folder.children.length : 0;

      let newNode = {
        path: folder.path + "/" + this.fileUploaded.name.toLowerCase(),
        name: this.fileUploaded.name,
        type: "file",
        'element-id': folder['element-id'] + element_id + 1,
        metadata: {}
      }

      folder.children.unshift(newNode);

      this.updateDocumentSystem()

      $('#uploadFileModal').modal('hide')
      //this.resetFileUploaderForm()
    }
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

    console.log("Move ", this.selectedDocument, " into ", this.selectedFolderNode)

    if (this.selectedDocument && this.selectedFolderNode) {
      var nodeToMove = this.searchDocByElementId(this.rawData, this.selectedDocument.data)
      var folder = this.searchDocByElementId(this.rawData, this.selectedFolderNode.data)

      var originalPath = JSON.parse(JSON.stringify(nodeToMove.path));
      originalPath = originalPath.split("/" + nodeToMove.name.toLowerCase())[0]

      var originalFolder = this.searchDocByPath(this.rawData, originalPath)

      console.log (nodeToMove, originalFolder)

      this.updatePaths(nodeToMove, folder.path)

      folder.children.unshift(nodeToMove);
      var i = originalFolder.children.findIndex((c:any) => c['element-id'] === nodeToMove['element-id'])
      originalFolder.children.splice(i, 1)

      this.updateDocumentSystem()

      $('#moveModal').modal('hide')
      //this.resetMoveForm()
    }

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

    if (this.selectedDocument && this.newName) {
      var node = this.searchDocByElementId(this.rawData, this.selectedDocument.data)
      console.log (node)
      node.path = node.path.replace(node.name.toLowerCase(), this.newName.toLowerCase())
      node.name = this.newName;

      console.log("dopo", node)
      this.updateDocumentSystem()

      $('#renameModal').modal('hide')
      this.resetRenameForm()
    }
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
    if (event.node.data.type == "trash") {
      console.log("hide")
      cm.hide()
      return
    }

    console.log('menu', event.node)

    this.generateContextMenu(event.node)
  }

  showAddFolderModal(): void {
    this.resetAddFolderForm();

    if (this.selectedDocument && this.selectedDocument.data?.type == "directory") {
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
      if (this.selectedDocument.data?.type == "directory"){
        this.foldersAvailableToMoveElementIn = JSON.parse(JSON.stringify(this.foldersAvailableToAddFolder))
      }
      else {
        this.foldersAvailableToMoveElementIn = JSON.parse(JSON.stringify(this.foldersAvailableToFileUpload))
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

    if (this.selectedDocument && this.selectedDocument.data?.type == "directory") {
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

    if (doc.type == "directory") {
      node.expandedIcon = "pi pi-folder-open"
      node.collapsedIcon = "pi pi-folder"
    }
    else if (doc.type == "file") {
      node.icon = "pi pi-file"
      node.leaf = true
    }

    if (doc.type == "trash") {
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
    if (node.data.type == "trash") {
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

    if (node.data.type == "directory") {
      cmItems.unshift(menuAddFolder)
    }

    this.items = cmItems;
  }

  private omitFilesAndTrash(docs: any[]) {
    var dataParsed: TreeNode<any>[] = [];

    docs.forEach((obj) => {
      if (obj.data.type != "trash" && obj.children) {
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

    this.files = this.documentsToTreeNodes(this.rawData)

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
