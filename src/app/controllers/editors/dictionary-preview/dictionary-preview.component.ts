import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MessageService, TreeNode } from 'primeng/api';
import { catchError, concatMap, forkJoin, from, map, mergeMap, Observable, of, Subject, take, takeUntil, throwError, toArray, zip } from 'rxjs';
import { DictionaryNoteVocabo } from 'src/app/models/custom-models/dictionary-note-vocabo';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { DictionarySortingItem } from 'src/app/models/dictionary/dictionary-sorting-item.model';
import { TextualDocument } from 'src/app/models/dictionary/textual-document.model';
import { SearchAnnotationFilters, SearchAnnotationRequest } from 'src/app/models/search/search-annotation-request';
import { SearchAnnotationResult } from 'src/app/models/search/search-annotation-result';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { SearchAnnotationService } from 'src/app/services/search-annotation.service';

/**
 * classe che rappresenta una accezione (meaning) con le sue annotazioni
 */
export class Meaning {
  id!: string;
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
  public senseLexicalEntriesTree: TreeNode<DictionarySortingItem>[] = [];
  public meaningsPerSenseAnnotations: SenseEntry[] = [];

  constructor(private lexiconService: LexiconService,
    private dictionaryService: DictionaryService,
    private searchAnnotationService: SearchAnnotationService,
    private commonService: CommonService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
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
      let lexicalEntryId = this.retrieveLexicalEntryId(sortedItems);

      this.retrieveAndSetForms(lexicalEntryId);

      this.senseLexicalEntriesTree = this.mapSortingItemToTreeNode(sortedItems);

      this.retrieveMeaningsPerSenseAnnotations()
        .pipe(
          takeUntil(this.unsubscribe$),
          catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message))
        )
        .subscribe(senseEntries => {
          this.meaningsPerSenseAnnotations = senseEntries;
        });
    });
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

        const request = new SearchAnnotationRequest();
        request.start = 0;
        request.end = 100;
        const filters = new SearchAnnotationFilters();
        filters.searchMode = 'SEMANTICS';
        filters.contextLength = 20;
        filters.searchValue = meaning.id;
        request.filters = filters;

        return this.searchAnnotationService.searchAnnotationBySense(request).pipe(
          map(result => {
            meaning.sortedAnnotations = result;
            return meaning;
          })
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
  private retrieveLexicalEntryId(sortedItems: DictionarySortingItem[]): string {
    let lexicalEntrySortingItem = sortedItems.filter(item => item.type.includes('LexicalEntry'))[0] || null;
    let lexicalEntryId = lexicalEntrySortingItem ? lexicalEntrySortingItem.referredEntity : null;

    if (!lexicalEntryId) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig('No lexical entry found'));
      throw new Error('No lexical entry found');
    }
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
   * @param items {DictionarySortingItem[]}
   * @param parentIndex {string}
   * @returns {TreeNode<DictionarySortingItem>[]}
   */
  private mapSortingItemToTreeNode(items: DictionarySortingItem[], parentIndex?: string): TreeNode<DictionarySortingItem>[] {
    return items.map((item, i) => {
      const isMeaning = item.type.includes('LexicalSense');
      const itemIndex = !parentIndex ? (isMeaning ? `${i + 1}` : '') : `${parentIndex}.${i + 1}`;
      return <TreeNode<DictionarySortingItem>>{
        key: item.id,
        type: isMeaning ? 'meaning' : 'senseLexicalEntry',
        label: item.label,
        data: item,
        index: itemIndex,
        expanded: true,
        children: this.mapSortingItemToTreeNode(item.children ?? [], itemIndex)
      }
    });
  }
}
