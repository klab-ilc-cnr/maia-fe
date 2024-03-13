import { Component, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Observable, of, switchMap } from 'rxjs';
import { ElementType } from 'src/app/models/corpus/element-type';
import { CorpusElement, FolderElement } from 'src/app/models/texto/corpus-element';
import { CorpusStateService } from 'src/app/services/corpus-state.service';

@Component({
  selector: 'app-workspace-search-tile',
  templateUrl: './workspace-search-tile.component.html',
  styleUrls: ['./workspace-search-tile.component.scss']
})
export class WorkspaceSearchTileComponent implements OnInit {

  constructor(private corpusStateService: CorpusStateService) { }

  selectedDocuments: any[] = [];
  files!: TreeNode<CorpusElement>[];

  ngOnInit(): void {
    this.corpusStateService.filesystem$.pipe(
      switchMap(docs => of(this.mapToTreeNodes(docs))),
    ).subscribe(result => {
      this.files = result;
    });
  }

  /**
   *refresh documents data  
   */
  reloadSelectedDocuments(): void {
    this.corpusStateService.refreshFileSystem.next(null);
  }

  /**
   * mapper to the treenode element
   */
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

}
