import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { catchError, of, Subject, take } from 'rxjs';
import { DictionaryNoteVocabo } from 'src/app/models/custom-models/dictionary-note-vocabo';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { DictionaryPreviewItem } from 'src/app/models/dictionary/dictionary-preview-item.model';
import { DictionarySortingItem } from 'src/app/models/dictionary/dictionary-sorting-item.model';
import { TextualDocument } from 'src/app/models/dictionary/textual-document.model';
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
export class DictionaryPreviewComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();

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

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
   * Calculate the total occurrences from the structured note frequencies.
   * @returns {number}
   */
  get totalOccurrences() {
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

      this.senseLexicalEntriesTree = this.mapSortingItemToPreviewTreeNode(sortedItems).map(node => {
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

      let lexicalEntryId = this.retrieveLexicalEntryId(sortedItems);
      if (!lexicalEntryId) { return; }
      this.retrieveAndSetForms(lexicalEntryId);
    });
  }

  /**
   * Handler for node expand event.
   * @param event {any}
   */
  public onNodeExpand(event: any): void {
    const node: TreeNode<DictionaryPreviewItem> = event.node;
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
   * Retrieve forms for a given lexical entry ID.
   * @param lexicalEntryId {string}
   */
  private retrieveAndSetForms(lexicalEntryId: string): void {
    this.lexiconService.getLexicalEntryForms(lexicalEntryId).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message))
    ).subscribe((forms: any) => {
      this.forms = forms.map((form: any) => form.label);
    });
  }

  /**
   * Retrieve the lexical entry ID from sorted items.
   * @param sortedItems {DictionarySortingItem[]}
   * @returns {string}
   */
  private retrieveLexicalEntryId(sortedItems: DictionarySortingItem[]): string | null {
    let lexicalEntrySortingItem = sortedItems.filter(item => item.type.includes('LexicalEntry'))[0] || null;
    let lexicalEntryId = lexicalEntrySortingItem ? lexicalEntrySortingItem.referredEntity : null;

    return lexicalEntryId;
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
