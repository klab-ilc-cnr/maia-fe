import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { catchError, concatMap, forkJoin, from, map, Observable, of, Subject, take, takeUntil, toArray } from 'rxjs';
import { DictionaryNoteVocabo } from 'src/app/models/custom-models/dictionary-note-vocabo';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { DictionaryPreviewItem } from 'src/app/models/dictionary/dictionary-preview-item.model';
import { DictionarySortingItem } from 'src/app/models/dictionary/dictionary-sorting-item.model';
import { TextualDocument } from 'src/app/models/dictionary/textual-document.model';
import { SearchAnnotationFilters, SearchAnnotationRequest } from 'src/app/models/search/search-annotation-request';
import { SearchAnnotationResult } from 'src/app/models/search/search-annotation-result';
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
    private commonService: CommonService,
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

      // this.retrieveMeaningsPerSenseAnnotations()
      //   .pipe(
      //     takeUntil(this.unsubscribe$),
      //     catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message))
      //   )
      //   .subscribe(senseEntries => {
      //     this.meaningsPerSenseAnnotations = senseEntries;
      //   });

      // this.addSearchAnnotations();

      let lexicalEntryId = this.retrieveLexicalEntryId(sortedItems);
      if (!lexicalEntryId) { return; }
      this.retrieveAndSetForms(lexicalEntryId);
    });
  }

  test2(sent: any) {
    console.log(sent)
  }

  public onNodeExpand(event: any): void {
    const node: TreeNode<DictionaryPreviewItem> = event.node;
    this.retrieveAndAddSearchAnnotationsForMeaning(node);
  }

  /**handler for page change */
  onPage(event: any, searchAnnotation: SearchAnnotationResult) {
    searchAnnotation.first = event.first;
    searchAnnotation.rows = event.rows;
  }

  public lazyLoadSearchResults(event: any, senseChildMeaning: TreeNode<DictionaryPreviewItem>) {
    this.retrieveAndAddSearchAnnotationsForMeaning(senseChildMeaning);
  }

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

  // private addSearchAnnotations(): void {
  //   this.senseLexicalEntriesTree.forEach(senseLexicalEntry => {
  //     let senseEntry = new SenseEntry();
  //     senseEntry.id = senseLexicalEntry.key!;

  //     senseLexicalEntry.children?.forEach(senseChildMeaning => {
  //       const meaning: Meaning = new Meaning();
  //       meaning.id = senseChildMeaning.key!;
  //       meaning.referredEntity = senseChildMeaning.data?.referredEntity!;

  //       const request = new SearchAnnotationRequest();
  //       request.start = 0;
  //       request.end = this.defaultVisibleRows;
  //       const filters = new SearchAnnotationFilters();
  //       filters.searchMode = 'SEMANTICS';
  //       filters.searchValue = meaning.referredEntity;
  //       request.filters = filters;

  //       this.searchAnnotationService.searchAnnotationBySense(request).pipe(
  //         take(1),
  //         catchError(() => of(new SearchAnnotationResult()))
  //       ).subscribe(result => {
  //         result.rows = this.defaultVisibleRows;
  //         senseChildMeaning.children = this.buildAnnotationsLeaf(result);
  //       });
  //     });
  //   });
  // }

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
   * Retrieve meanings per sense annotations.
   * @returns {Observable<SenseEntry[]>}
   */
  private retrieveMeaningsPerSenseAnnotations(): Observable<SenseEntry[]> {
    const senseEntries$ = this.senseLexicalEntriesTree.map(senseLexicalEntry => {
      let senseEntry = new SenseEntry();
      senseEntry.id = senseLexicalEntry.key!;

      const requests$ = senseLexicalEntry.children?.map(senseChildMeaning => {
        const meaning: Meaning = new Meaning();
        meaning.id = senseChildMeaning.key!;
        meaning.referredEntity = senseChildMeaning.data?.referredEntity!;

        const request = new SearchAnnotationRequest();
        request.start = 0;
        request.end = 100;
        const filters = new SearchAnnotationFilters();
        filters.searchMode = 'SEMANTICS';
        filters.searchValue = meaning.referredEntity;
        request.filters = filters;

        return this.searchAnnotationService.searchAnnotationBySense(request).pipe(
          map(result => {
            meaning.sortedAnnotations = result;
            return meaning;
          }),
          catchError(() => of(meaning))
        );
      }) || [];

      return from(requests$).pipe(
        concatMap(obs => obs),
        toArray(),
        map(meanings => {
          senseEntry.meanings = meanings;
          return senseEntry;
        })
      );
    });

    return forkJoin(senseEntries$);
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
