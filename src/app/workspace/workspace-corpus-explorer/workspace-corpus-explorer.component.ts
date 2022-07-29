import { DocumentElement } from './../../model/tileContent/document-element';
import { Component, OnInit } from '@angular/core';
import { MenuItem, TreeNode } from 'primeng/api';
import { WorkspaceService } from 'src/app/services/workspace.service';

@Component({
  selector: 'app-workspace-corpus-explorer',
  templateUrl: './workspace-corpus-explorer.component.html',
  styleUrls: ['./workspace-corpus-explorer.component.scss']
})
export class WorkspaceCorpusExplorerComponent implements OnInit {

  files: TreeNode<DocumentElement>[] = [];
  s: string | undefined;
  selectedFile: TreeNode<DocumentElement> | undefined;
  items: MenuItem[] = [];

  constructor(
    private workspaceService: WorkspaceService
  ) { }

  ngOnInit(): void {
    // this.generateContextMenu()

    this.workspaceService.retrieveCorpus("1").subscribe({
      next: (data) => {
        console.log('qui', data)
        if (data.documentSystem) {
          this.files = this.documentsToTreeNodes(data.documentSystem)
        }
      }
    })
  }

  onSearch(): void {
    console.log('cerca')
  }

  onTreeContextMenuSelect(event: any): void {
    console.log('menu', event.node)



    this.generateContextMenu(event.node)
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

    node.label = doc.name
    node.data = doc

    return node;
  }

  private generateContextMenu(node: TreeNode): void {
    let cmItems = [
      {label: 'Rinomina', icon: 'fa-solid fa-pen', command: (event: any) => console.log("rinomina", this.selectedFile)},
      {label: 'Sposta', icon: 'fa-solid fa-sync', command: (event: any) => console.log("sposta", this.selectedFile)},
      {label: 'Elimina', icon: 'pi pi-trash', command: (event: any) => console.log("elimina", this.selectedFile)}
      // {label: 'Unselect', icon: 'pi pi-times', command: (event) => this.unselectFile()}
    ];

    if (node.data.type == "directory") {
      cmItems.unshift({
        label: 'Aggiungi cartella',
        icon: 'fa-solid fa-folder-plus',
        command: (event) => console.log("aggiungi cartella", this.selectedFile)
      })
    }

    this.items = cmItems;
  }
}
