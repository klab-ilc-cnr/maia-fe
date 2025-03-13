import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { catchError, of, Subject, take } from 'rxjs';
import { DictionaryNoteVocabo } from 'src/app/models/custom-models/dictionary-note-vocabo';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { DictionaryPreviewItem } from 'src/app/models/dictionary/dictionary-preview-item.model';
import { DictionarySortingItem } from 'src/app/models/dictionary/dictionary-sorting-item.model';
import { TextualDocument } from 'src/app/models/dictionary/textual-document.model';
import { FormListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { SearchAnnotationFilters, SearchAnnotationRequest } from 'src/app/models/search/search-annotation-request';
import { SearchAnnotationResult, SearchAnnotationResultRow } from 'src/app/models/search/search-annotation-result';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { SearchAnnotationService } from 'src/app/services/search-annotation.service';

/**
 * classe che rappresenta una accezione (meaning) con le sue annotazioni
 */
export class Meaning {
  id!: string;
  referredEntity?: string;
  sortedAnnotations!: SearchAnnotationResult;
}

/**
 * classe che rappresenta le accezioni (meanings) di una singola voce (lexical entry del sense)
 * */
export class SenseEntry {
  id!: string;
  meanings: Meaning[] = [];
}

@Component({
  selector: 'app-dictionary-preview',
  templateUrl: './dictionary-preview.component.html',
  styleUrls: ['./dictionary-preview.component.scss']
})
export class DictionaryPreviewComponent implements OnInit {
  private readonly CONTEXT_LENGTH = 20;
  private loading = true;

  @Input() dictionaryEntry!: DictionaryEntry;

  public structuredNote!: DictionaryNoteVocabo;
  public forms: string[] = [];
  public firstAttestationLabel: string = '';
  public frequencies: { documentLabel: string; frequency: number }[] = [];
  public senseLexicalEntriesTree: TreeNode<DictionaryPreviewItem>[] = [];
  public meaningsPerSenseAnnotations: SenseEntry[] = [];
  public defaultVisibleRows = 5;

  constructor(private lexiconService: LexiconService,
    private dictionaryService: DictionaryService,
    private searchAnnotationService: SearchAnnotationService,
    private commonService: CommonService
  ) { }

  get ready(): boolean {
    return !!this.dictionaryEntry && !this.loading;
  }

  /**
   * Calculate the total occurrences from the structured note frequencies.
   * @returns {number}
   */
  get totalOccurrences(): number {
    let count = 0;
    if (this.structuredNote && this.structuredNote.frequencies) {
      this.structuredNote.frequencies.forEach(f => {
        count = count + f.frequency;
      });
    }
    return this.structuredNote ? count + this.structuredNote.decameronOccurrences : count;
  }

  ngOnInit(): void {
    this.retrieveHeaderEntryData();

    this.dictionaryService.retrieveDictionarySortingItems(this.dictionaryEntry.id).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe((sortedItems: DictionarySortingItem[]) => {

      this.senseLexicalEntriesTree = this.buildSenseLexicalEntriesTree(sortedItems);

      this.expandSenseLexicalEntriesTree(this.senseLexicalEntriesTree);

      let lexicalEntryIds = this.retrieveLexicalEntryIds(sortedItems);

      if (lexicalEntryIds.length === 0) {
        this.loading = false;
        return;
      }

      this.retrieveAndSetForms(lexicalEntryIds);

      this.loading = false;
    });
  }

  /**
   * Handler for node expand event.
   * @param event {any}
   */
  public onNodeExpand(node: TreeNode<DictionaryPreviewItem>): void {
    if (node.type !== 'meaning') { return; }

    this.retrieveAndAddSearchAnnotationsForMeaning(node);
  }

  /**
   * Handler for page change event.
   * @param event {any}
   * @param searchAnnotation {SearchAnnotationResult}
   */
  public onPage(event: any, searchAnnotation: SearchAnnotationResult): void {
    searchAnnotation.first = event.first;
    searchAnnotation.rows = event.rows;
  }

  /**
   * Lazy load search results for a given sense child meaning.
   * @param event {any}
   * @param senseChildMeaning {TreeNode<DictionaryPreviewItem>}
   */
  public lazyLoadSearchResults(event: any, senseChildMeaning: TreeNode<DictionaryPreviewItem>) {
    this.retrieveAndAddSearchAnnotationsForMeaning(senseChildMeaning);
  }

  /**
   * Highlight the text based on the annotation offsets.
   * @param annotation {SearchAnnotationResultRow}
   * @returns {string}
   */
  public highlightSection(annotation: SearchAnnotationResultRow): string {
    let section: string = annotation.section;
    let highlights = annotation.offsets;

    if (!section || !highlights || highlights.length === 0) {
      return section;
    }

    // Ordina gli intervalli per inizio (nel caso non siano ordinati)
    highlights.sort((a: { start: number; }, b: { start: number; }) => a.start - b.start);

    let result = '';
    let lastIndex = 0;

    for (const { start, end } of highlights) {
      if (start >= end || start < lastIndex) {
        continue;
      }

      result += section.substring(lastIndex, start);
      result += `<span class="highlight">${section.substring(start, end)}</span>`;
      lastIndex = end;
    }

    result += section.substring(lastIndex);

    return result;
  }

  /**
   * Processes the sorted dictionary items and converts them into a tree structure.
   * It ensures that each node's children are unique based on the `referredEntity` property.
   * Additionally, it assigns an index to each child node.
   *
   * @param sortedItems - An array of `DictionarySortingItem` representing the sorted dictionary items.
   * @returns An array of `TreeNode<DictionaryPreviewItem>` representing the tree structure of the dictionary preview items.
   */
  private buildSenseLexicalEntriesTree(sortedItems: DictionarySortingItem[]): TreeNode<DictionaryPreviewItem>[] {
    return this.mapSortingItemToPreviewTreeNode(sortedItems).map(node => {
      if (node.children) {
        const uniqueChildren = new Map<string, TreeNode<DictionaryPreviewItem>>();
        node.children.forEach(child => {
          if (child.data?.referredEntity && !uniqueChildren.has(child.data.referredEntity)) {
            uniqueChildren.set(child.data.referredEntity, child);
          }
        });
        node.children = Array.from(uniqueChildren.values()).map((child, index) => {
          child.data!.index = index + 1;
          return child;
        });
      }
      return node;
    });
  }

  /**
   * Expands all nodes in the given tree of sense lexical entries.
   * 
   * This method iterates through each node in the provided tree and sets the `expanded` property to `true`
   * for both the node and its children. Additionally, it calls the `onNodeExpand` method for each child node.
   * 
   * @param senseLexicalEntriesTree - An array of `TreeNode` objects representing the tree of sense lexical entries.
   */
  private expandSenseLexicalEntriesTree(senseLexicalEntriesTree: TreeNode<DictionaryPreviewItem>[]): void {
    senseLexicalEntriesTree.forEach(node => {
      if (node.children) {
        node.expanded = true;
        node.children.forEach(child => {
          child.expanded = true;
          this.onNodeExpand(child);
        });
      }
    });
  }

  /**
   * Retrieve and add search annotations for a given sense child meaning.
   * @param senseChildMeaning {TreeNode<DictionaryPreviewItem>}
   */
  private retrieveAndAddSearchAnnotationsForMeaning(senseChildMeaning: TreeNode<DictionaryPreviewItem>): void {
    const meaning: Meaning = new Meaning();
    meaning.id = senseChildMeaning.key!;
    meaning.referredEntity = senseChildMeaning.data?.referredEntity!;

    const request = new SearchAnnotationRequest();
    request.start = senseChildMeaning.children![0].data?.searchAnnotation?.first ?? 0;
    request.end = request.start + (senseChildMeaning.children![0].data?.searchAnnotation?.rows ?? this.defaultVisibleRows);
    const filters = new SearchAnnotationFilters();
    filters.searchMode = 'SEMANTICS';
    filters.searchValue = meaning.referredEntity;
    filters.contextLength = this.CONTEXT_LENGTH;
    request.filters = filters;

    this.searchAnnotationService.searchAnnotationBySense(request).pipe(
      take(1),
      catchError(() => of(new SearchAnnotationResult()))
    ).subscribe(result => {
      result.first = request.start;
      result.rows = senseChildMeaning.children![0].data?.searchAnnotation?.rows ?? this.defaultVisibleRows;
      senseChildMeaning.children = this.buildAnnotationsLeaf(result);
    });
  }

  /**
   * Build annotations leaf nodes from search annotation result.
   * @param result {SearchAnnotationResult}
   * @returns {Array<TreeNode<DictionaryPreviewItem>>}
   */
  private buildAnnotationsLeaf(result: SearchAnnotationResult): Array<TreeNode<DictionaryPreviewItem>> {
    const annotationLeafData: DictionaryPreviewItem = {
      searchAnnotation: result,
      id: '',
      referredEntity: '',
      type: [],
      prefix: [],
      label: '',
      suffix: [],
      index: 0
    };

    const annotationLeaf: TreeNode<DictionaryPreviewItem> = {
      type: 'annotation',
      leaf: true,
      data: annotationLeafData
    };

    return [annotationLeaf];
  }


  /**
   * Retrieves and sets forms for the given lexical entry IDs.
   *
   * This method iterates over the provided lexical entry IDs, retrieves the forms
   * for each lexical entry using the `lexiconService`, and appends the form labels
   * to the `forms` array. In case of an error during the retrieval of forms, it logs
   * the error to the console and continues with an empty array.
   *
   * @param lexicalEntryIds - An array of lexical entry IDs for which to retrieve forms.
   */
  private retrieveAndSetForms(lexicalEntryIds: string[]): void {
    lexicalEntryIds.forEach(lexicalEntryId => {
      this.lexiconService.getLexicalEntryForms(lexicalEntryId).pipe(
        take(1),
        catchError((error: HttpErrorResponse) => {
          console.error(`Error retrieving forms for lexical entry ID ${lexicalEntryId}:`, error);
          return of([]); // Continue with an empty array in case of error
        })
      ).subscribe((forms: FormListItem[]) => {
        this.forms.push(...forms.map((form: FormListItem) => form.label));
      });
    });
  }


  /**
   * Retrieves an array of unique lexical entry IDs from the provided sorted items.
   *
   * This function filters the input array to include only items that have a type
   * containing 'lexicalentry', 'word', or 'multiwordexpression' (case insensitive).
   * It then extracts the `referredEntity` property from these filtered items and
   * returns a unique array of these IDs.
   *
   * @param sortedItems - An array of `DictionarySortingItem` objects to be filtered and processed.
   * @returns An array of unique lexical entry IDs.
   */
  private retrieveLexicalEntryIds(sortedItems: DictionarySortingItem[]): string[] {
    let lexicalEntrySortingItems = sortedItems.filter(item =>
      item.type.some(type => type.toLowerCase().includes('lexicalentry')) ||
      item.type.some(type => type.toLowerCase().includes('word')) ||
      item.type.some(type => type.toLowerCase().includes('multiwordexpression')));

    let lexicalEntryIds = Array.from(new Set(lexicalEntrySortingItems.map(item => item.referredEntity)));

    return lexicalEntryIds;
  }

  /**
   * Retrieve header entry data and populate structured note and frequencies.
   */
  private retrieveHeaderEntryData(): void {
    this.structuredNote = new DictionaryNoteVocabo(this.dictionaryEntry.note);

    this.structuredNote.frequencies.forEach((f) => {
      this.dictionaryService.retrieveAuthorDocuments().pipe(
        take(1),
        catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message))
      ).subscribe((data: TextualDocument[]) => {
        let document = data.filter((item: TextualDocument) => item.code === f.documentId)[0] || null;
        this.frequencies.push({ documentLabel: document?.title || '', frequency: f.frequency });
      });
    });

    this.dictionaryService.retrieveAuthorDocuments().pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message))
    ).subscribe((data: TextualDocument[]) => {
      this.firstAttestationLabel = data.filter((item: TextualDocument) => item.code === this.structuredNote.firstAttestation)[0]?.title || '';
    });
  }

  /**
   * Map the list of items to be sorted in a TreeNode list.
   * @param items {DictionaryPreviewItem[]}
   * @param parentIndex {string}
   * @returns {TreeNode<DictionaryPreviewItem>[]}
   */
  private mapSortingItemToPreviewTreeNode(items: DictionarySortingItem[]): TreeNode<DictionaryPreviewItem>[] {
    if (items.length === 0) {
      return [{}];
    }
    return items.map((item, i) => {
      const isMeaning = item.type.includes('LexicalSense');
      return <TreeNode<DictionaryPreviewItem>>{
        key: item.id,
        type: isMeaning ? 'meaning' : 'senseLexicalEntry',
        label: item.label,
        data: item,
        expanded: !isMeaning,
        children: this.mapSortingItemToPreviewTreeNode(item.children ?? [])
      }
    });
  }
}
