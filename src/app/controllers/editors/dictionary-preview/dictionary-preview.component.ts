import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { catchError, of, take } from 'rxjs';
import { DictionaryNoteVocabo } from 'src/app/models/custom-models/dictionary-note-vocabo';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { DictionaryPreviewItem } from 'src/app/models/dictionary/dictionary-preview-item.model';
import { DictionarySortingItem } from 'src/app/models/dictionary/dictionary-sorting-item.model';
import { TextualDocument } from 'src/app/models/dictionary/textual-document.model';
import { FormListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { LinguisticRelationModel } from 'src/app/models/lexicon/linguistic-relation.model';
import { SearchAnnotationFilters, SearchAnnotationRequest } from 'src/app/models/search/search-annotation-request';
import { SearchAnnotationResult, SearchAnnotationResultRow } from 'src/app/models/search/search-annotation-result';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService, DictionaryTraits } from 'src/app/services/dictionary.service';
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

interface PosLexicalEntriesGroups {
  [key: string]: Set<string>;
}

interface FormItemPreview {
  pos: string;
  label: string;
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
  public forms: FormItemPreview[] = [];
  public firstAttestationLabel: string = '';
  public frequencies: { documentLabel: string; frequency: number }[] = [];
  public senseLexicalEntriesTree: TreeNode<DictionaryPreviewItem>[] = [];
  public meaningsPerSenseAnnotations: SenseEntry[] = [];
  public defaultVisibleRows = 5;
  public orderedSeeAlso: LinguisticRelationModel[] = [];
  public posTraits: DictionaryTraits[] = [];

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

  get posAndTraits(): string {
    if (!this.posTraits || this.posTraits.length === 0) return '';
    return this.posTraits
      .map(pt => {
        const pos = pt.pos ?? '';
        const traits = Array.isArray(pt.traits) && pt.traits.length > 0 ? pt.traits.join('') : '';
        return traits ? `${pos}${traits}` : pos;
      })
      .join(', ');
  }

  ngOnInit(): void {
    this.retrieveHeaderEntryData();

    this.orderedSeeAlso = this.dictionaryEntry.seeAlso.sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));

    this.dictionaryService.retrieveDictionarySortingItems(this.dictionaryEntry.id).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe((sortedItems: DictionarySortingItem[]) => {

      this.senseLexicalEntriesTree = this.buildSenseLexicalEntriesTree(sortedItems);

      this.expandSenseLexicalEntriesTree(this.senseLexicalEntriesTree);

      let lexicalEntryGroups = this.retrieveLexicalEntryPosGroups(sortedItems);

      this.retrieveAndSetForms(lexicalEntryGroups);

      this.loading = false;
    });
  }

  /**
   * Handler for node expand event.
   * @param event {any}
   */
  public onNodeExpand(node: TreeNode<DictionaryPreviewItem>): void {
    this.expandSenseLexicalEntriesTree([node]);
  }

  /**
   * Handler for page change event.
   * @param event {any}
   * @param annotationTreeItem {any}
   */
  public onPage(event: any, searchAnnotation: SearchAnnotationResult, tableId: string): void {
    searchAnnotation.first = event.first;
    searchAnnotation.rows = event.rows;

    // Scorri verso la tabella specifica
    const tableElement = document.getElementById(tableId);
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
        const uniqueChildren = Array.from(
          new Map(
            node.children
              .filter(child => child.data?.referredEntity)
              .map(child => [child.data!.referredEntity, child])
          ).values()
        );
        uniqueChildren.forEach((child, index) => {
          child.data!.index = (index + 1).toString();
          if (child.children) {
            child.children.forEach((grandChild, grandChildIndex) => {
              if (grandChild.data) {
                grandChild.data.index = `${child.data!.index}.${grandChildIndex + 1}`;
              }
            });
          }
        });
        node.children = uniqueChildren;
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
    const expand = (node: TreeNode<DictionaryPreviewItem>) => {
      node.expanded = true;
      if (node.type === 'meaning') {
        this.retrieveAndAddSearchAnnotationsForMeaning(node);
      }

      if (node.children) {
        node.children.forEach(expand);
      }
    };
    senseLexicalEntriesTree.forEach(expand);
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
      // Remove any existing annotation leaf nodes before adding the new one
      const nonAnnotationChildren = (senseChildMeaning.children ?? []).filter(child => child.type !== 'annotation');
      senseChildMeaning.children = [...this.buildAnnotationsLeaf(result), ...nonAnnotationChildren];
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
      index: '0'
    };

    const annotationLeaf: TreeNode<DictionaryPreviewItem> = {
      type: 'annotation',
      leaf: true,
      data: annotationLeafData
    };

    return [annotationLeaf];
  }

  /**
   * Retrieves and sets forms for each lexical entry in the provided lexical entry groups.
   * 
   * @param lexicalEntryGroups - An object where the keys are parts of speech (POS) and the values are arrays of lexical entry IDs.
   * 
   * This method iterates over each part of speech and its corresponding lexical entry IDs, retrieves the forms for each lexical entry ID using the `lexiconService`, 
   * and then maps and pushes the forms into the `forms` array with the associated part of speech.
   * 
   * In case of an error during the retrieval of forms, it logs the error to the console and continues with an empty array.
   */
  private retrieveAndSetForms(lexicalEntryGroups: PosLexicalEntriesGroups): void {
    Object.entries(lexicalEntryGroups).forEach(([pos, lexicalEntryIds]) => {
      lexicalEntryIds.forEach(lexicalEntryId => {
        this.lexiconService.getLexicalEntryForms(lexicalEntryId).pipe(
          take(1),
          catchError((error: HttpErrorResponse) => {
            console.error(`Error retrieving forms for lexical entry ID ${lexicalEntryId}:`, error);
            return of([]); // Continue with an empty array in case of error
          })
        ).subscribe((forms: FormListItem[]) => {
          this.forms.push(...forms.map((form: FormListItem) => ({ pos, label: form.label })));
        });
      });
    });
  }

  /**
   * Retrieves groups of lexical entries based on their parts of speech (POS) from the sorted items.
   * 
   * @param sortedItems - An array of `DictionarySortingItem` objects to be processed.
   * @returns An object where each key is a POS suffix and the value is a set of referred entities.
   * 
   * The function filters the sorted items to include only those with types that contain 'lexicalentry',
   * 'word', or 'multiwordexpression'. It then groups these items by their suffixes and collects the
   * referred entities into sets.
   */
  private retrieveLexicalEntryPosGroups(sortedItems: DictionarySortingItem[]): PosLexicalEntriesGroups {
    let lexicalEntrySortingItems = sortedItems.filter(item =>
      item.type.some(type => type.toLowerCase().includes('lexicalentry')) ||
      item.type.some(type => type.toLowerCase().includes('word')) ||
      item.type.some(type => type.toLowerCase().includes('multiwordexpression')));

    let posGroups: PosLexicalEntriesGroups = {};
    lexicalEntrySortingItems.forEach(item => {
      item.suffix.forEach(suffix => {
        if (!posGroups[suffix]) {
          posGroups[suffix] = new Set<string>();
        }
        posGroups[suffix].add(item.referredEntity);
      });
    });

    return posGroups;
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

    this.dictionaryService.retrieveDictionaryTraits(this.dictionaryEntry.id).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe((traits: DictionaryTraits[]) => {
      this.posTraits = traits;
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
      let type = isMeaning ? 'meaning' : 'senseLexicalEntry';
      return <TreeNode<DictionaryPreviewItem>>{
        key: item.id,
        type: type,
        label: item.label,
        data: item,
        expanded: !isMeaning,
        children: this.mapSortingItemToPreviewTreeNode(item.children ?? [])
      }
    });
  }
}