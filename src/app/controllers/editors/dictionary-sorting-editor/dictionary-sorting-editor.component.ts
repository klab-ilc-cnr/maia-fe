import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MessageService, TreeDragDropService, TreeNode } from 'primeng/api';
import { catchError, take } from 'rxjs';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { DictionarySortingItem } from 'src/app/models/dictionary/dictionary-sorting-item.model';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';

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
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
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
      const successMsg = this.commonService.translateKey('DICTIONARY_EDITOR.SORT_TAB.sortingSuccess');
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
      this.onLoadData();
    });
  }

  /**
   * Map the list of items to be sorted in a TreeNode list
   * @param items {DictionarySortingItem[]}
   * @returns {TreeNode<DictionarySortingItem>[]}
   */
  private mapSortingItemToTreeNode(items: DictionarySortingItem[], parentIndex?: string): TreeNode<DictionarySortingItem>[] {
    return items.map((item, i) => {
      const isSense = item.type.includes('LexicalSense');
      const itemIndex = !parentIndex ? (isSense ? `${i + 1}` : '') : `${parentIndex}.${i + 1}`;
      // const itemIndex = parentIndex ? (parentIndex === '' ? : `${parentIndex}.${i + 1}`) : `${i + 1}`
      return <TreeNode<DictionarySortingItem>>{
        key: item.id,
        type: isSense ? 'sense' : 'lexicalEntry',
        label: item.label,
        data: item,
        index: itemIndex,
        expanded: true,
        children: this.mapSortingItemToTreeNode(item.children ?? [], itemIndex)
      }
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
