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
  sortingTrees: TreeNode<DictionarySortingItem>[] = [];

  constructor(
    private dictionaryService: DictionaryService,
    private commonService: CommonService,
    private changeDetRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.dictionaryService.retrieveDictionarySortingItems(this.dictionaryEntry.id).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe(resp => {
      this.sortingTrees = this.mapSortingItemToTreeNode(resp);
      this.changeDetRef.detectChanges();
    });
  }

  onDrop(event: any) {
    if(event.dropNode.parent === undefined) return;
    event.accept();
  }

  onSaveUpdate() {
    console.info(this.sortingTrees)
  }

  private mapSortingItemToTreeNode(items: DictionarySortingItem[]): TreeNode<DictionarySortingItem>[] {
    return items.map(item => <TreeNode<DictionarySortingItem>>{
      key: item.id,
      type: item.type,
      label: item.label,
      data: item,
      expanded: true,
      children: this.mapSortingItemToTreeNode(item.children??[])
    });
  }

}
