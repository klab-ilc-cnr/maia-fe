import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { TreeDragDropService, TreeNode } from 'primeng/api';
import { catchError, take } from 'rxjs';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { DictionarySortingItem } from 'src/app/models/dictionary/dictionary-sorting-item.model';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';

@Component({
  selector: 'app-dictionary-sorting-editor',
  templateUrl: './dictionary-sorting-editor.component.html',
  styleUrls: ['./dictionary-sorting-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TreeDragDropService]
})
export class DictionarySortingEditorComponent implements OnInit {
  /**Dictionary entry currently in edit */
  @Input() dictionaryEntry!: DictionaryEntry;
  /**Keeps the last saved sort in memory */
  private _originalOrder: TreeNode<DictionarySortingItem>[] = [];
  /**Hierarchy of senses in process */
  sortingTrees: TreeNode<DictionarySortingItem>[] = [];

  /**
   * Constructor for DictionarySortingEditorComponent
   * @param dictionaryService {DictionaryService}
   * @param commonService {CommonService}
   * @param changeDetRef {ChangeDetectorRef}
   */
  constructor(
    private dictionaryService: DictionaryService,
    private commonService: CommonService,
    private changeDetRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.onLoadData();
  }

  /**Retrieve the tree data and refresh rendering */
  onLoadData() {
    this.dictionaryService.retrieveDictionarySortingItems(this.dictionaryEntry.id).pipe( //initial data retrieval
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe(resp => {
      this.sortingTrees = this.mapSortingItemToTreeNode(resp);
      this._originalOrder = structuredClone(this.sortingTrees);
      this.changeDetRef.detectChanges(); //rendering update
    });
  }

  /**
   * Check whether a displacement is acceptable
   * @param event {{originalEvent: any, dragNode: TreeNode<DictionarySortingItem>, dropNode: TreeNode<DictionarySortingItem>, index: number}}
   * @returns {void}
   */
  onDrop(event: any) {
    if (event.dropNode.parent === undefined) return;
    event.accept();
  }

  /**Restores the last saved sense ordering */
  onRestore() {
    this.sortingTrees = structuredClone(this._originalOrder);
  }

  /**Save a new hierarchy of lemmas and senses */
  onSaveUpdate() {
    this._originalOrder = structuredClone(this.sortingTrees);
    const sortedTree = this.reverseTreeNodeMapping(this.sortingTrees);
    this.dictionaryService.updateDictionarySorting(this.dictionaryEntry.id, sortedTree).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe(() => {
      this.onLoadData();
    });
  }

  /**
   * Map the list of items to be sorted in a TreeNode list
   * @param items {DictionarySortingItem[]}
   * @returns {TreeNode<DictionarySortingItem>[]}
   */
  private mapSortingItemToTreeNode(items: DictionarySortingItem[]): TreeNode<DictionarySortingItem>[] {
    return items.map(item => <TreeNode<DictionarySortingItem>>{
      key: item.id,
      type: item.type.includes('LexicalSense') ? 'sense' : 'lexicalEntry',
      label: item.label,
      data: item,
      expanded: true,
      children: this.mapSortingItemToTreeNode(item.children ?? [])
    });
  }

  /**
   * Reconverts the TreeNode list to a list of items to be sorted
   * @param treeNodes {TreeNode<DictionarySortingItem>[]}
   * @returns {DictionarySortingItem[]}
   */
  private reverseTreeNodeMapping(treeNodes: TreeNode<DictionarySortingItem>[]): DictionarySortingItem[] {
    return treeNodes.map(node => <DictionarySortingItem>{
      ...node.data,
      children: this.reverseTreeNodeMapping(node.children ?? [])
    });
  }
}
