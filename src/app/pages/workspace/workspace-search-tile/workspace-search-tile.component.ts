import { Component, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Observable, of, switchMap } from 'rxjs';
import { ElementType } from 'src/app/models/corpus/element-type';
import { SearchRequest } from 'src/app/models/search/search-request';
import { CorpusElement, FolderElement } from 'src/app/models/texto/corpus-element';
import { CorpusStateService } from 'src/app/services/corpus-state.service';
import { SearchService } from 'src/app/services/search.service';

/**selectButton model for search mode*/
interface SearchMode {
  name: string,
  code: string
  inactive: boolean
}

@Component({
  selector: 'app-workspace-search-tile',
  templateUrl: './workspace-search-tile.component.html',
  styleUrls: ['./workspace-search-tile.component.scss']
})
export class WorkspaceSearchTileComponent implements OnInit {

  constructor(private corpusStateService: CorpusStateService,
    private searchService: SearchService) { }

  selectedDocuments: TreeNode<CorpusElement>[] = [];
  files!: TreeNode<CorpusElement>[];

  searchValue: string = '';
  searchModes!: Array<SearchMode>;
  selectedSearchMode!: SearchMode;
  searchLabel: string = '';

  ngOnInit(): void {
    this.corpusStateService.filesystem$.pipe(
      switchMap(docs => of(this.mapToTreeNodes(docs))),
    ).subscribe(result => {
      this.files = result;
    });

    this.initSearchMode();
  }

  /**search mode handler */
  onSearchModeChange() {
    if (this.selectedSearchMode.code === 'form') {
      this.searchLabel = 'insert form';
      return;
    }

    this.searchLabel = 'insert lemma';
  }

  /**prepare data and send search request */
  onSearch() {
    let request = new SearchRequest();

    request.selectedResourcesIds = this.mapSelectedDocumentsIds();

    console.log(request.selectedResourcesIds);

    this.searchService.search(request).subscribe(result => {
      console.log(result);
    });
  }

  onClear() {
    this.selectedDocuments = [];
  }


  /**init searchMode data */
  private initSearchMode() {
    this.searchModes = [
      { name: 'form', code: 'form', inactive: false },
      { name: 'lemma', code: 'lemma', inactive: false },
    ];

    this.selectedSearchMode = this.searchModes[0];
    this.onSearchModeChange();
  }

  private expandRecursive(node: TreeNode, isExpand: boolean) {
    node.expanded = isExpand;
    if (node.children) {
      node.children.forEach(childNode => {
        this.expandRecursive(childNode, isExpand);
      });
    }
  }

  /**extract only ids of the files from the document tree */
  private mapSelectedDocumentsIds(): Array<Number> {
    return this.selectedDocuments.filter(selectedNode => selectedNode.leaf).map(leaf => leaf.data?.id!);
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
      node.key = element.id.toString();
      const e = <FolderElement>element;
      node.children = this.mapToTreeNodes(e.children);
      node.expandedIcon = "pi pi-folder-open";
      node.collapsedIcon = "pi pi-folder";
    }
    if (element.type === ElementType.RESOURCE) {
      node.key = element.id.toString();
      node.icon = "pi pi-file";
      node.leaf = true;
    }
    node.label = element.name;
    node.data = element;
    return node;
  }

}
