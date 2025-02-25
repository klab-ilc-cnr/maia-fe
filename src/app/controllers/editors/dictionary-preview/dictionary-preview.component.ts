import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { MessageService, TreeNode } from 'primeng/api';
import { catchError, take, throwError } from 'rxjs';
import { DictionaryNoteVocabo } from 'src/app/models/custom-models/dictionary-note-vocabo';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { DictionarySortingItem } from 'src/app/models/dictionary/dictionary-sorting-item.model';
import { TextualDocument } from 'src/app/models/dictionary/textual-document.model';
import { CommonService } from 'src/app/services/common.service';
import { DictionaryService } from 'src/app/services/dictionary.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';

@Component({
  selector: 'app-dictionary-preview',
  templateUrl: './dictionary-preview.component.html',
  styleUrls: ['./dictionary-preview.component.scss']
})
export class DictionaryPreviewComponent implements OnInit {

  @Input() dictionaryEntry!: DictionaryEntry;

  public structuredNote!: DictionaryNoteVocabo;
  public forms: string[] = [];
  public firstAttestationLabel: string = '';
  public frequencies: { documentLabel: string; frequency: number }[] = [];
  public sortingTree: TreeNode<DictionarySortingItem>[] = [];

  constructor(private lexiconService: LexiconService,
    private dictionaryService: DictionaryService,
    private commonService: CommonService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  get totalOccurrences() {
    let count = 0;
    if (this.structuredNote && this.structuredNote.frequencies) {
      this.structuredNote.frequencies.forEach(f => {
        count = count + f.frequency;
      });
    }
    return this.structuredNote ? count + this.structuredNote.decameronOccurrences : count;
  }

  public ngOnInit(): void {
    this.structuredNote = new DictionaryNoteVocabo(this.dictionaryEntry.note);

    this.structuredNote.frequencies.forEach((f) => {
      this.dictionaryService.retrieveAuthorDocuments().pipe(
        take(1),
        catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
      ).subscribe((data: TextualDocument[]) => {
        let document = data.filter((item: TextualDocument) => item.code === f.documentId)[0] || null;
        this.frequencies.push({ documentLabel: document?.title || '', frequency: f.frequency });
      });
    });

    this.dictionaryService.retrieveAuthorDocuments().pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe((data: TextualDocument[]) => {
      this.firstAttestationLabel = data.filter((item: TextualDocument) => item.code === this.structuredNote.firstAttestation)[0]?.title || '';
    });

    this.dictionaryService.retrieveDictionarySortingItems(this.dictionaryEntry.id).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
    ).subscribe((data: DictionarySortingItem[]) => {
      let lexicalEntrySortingItem = data.filter(item => item.type.includes('LexicalEntry'))[0] || null;
      let lexicalEntryId = lexicalEntrySortingItem ? lexicalEntrySortingItem.referredEntity : null;

      if (!lexicalEntryId) {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig('No lexical entry found'));
        throw new Error('No lexical entry found');
      }

      this.sortingTree = this.mapSortingItemToTreeNode(data);

      this.lexiconService.getLexicalEntryForms(lexicalEntryId).pipe(
        take(1),
        catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
      ).subscribe((forms: any) => {
        this.forms = forms.map((form: any) => form.label);
      }
      );
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
}
