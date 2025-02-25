import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { catchError, take, throwError } from 'rxjs';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';
import { DictionarySortingItem } from 'src/app/models/dictionary/dictionary-sorting-item.model';
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
  public forms: string[] = [];

  constructor(private lexiconService: LexiconService,
    private dictionaryService: DictionaryService,
    private commonService: CommonService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  ngOnInit(): void {
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

      this.lexiconService.getLexicalEntryForms(lexicalEntryId).pipe(
        take(1),
        catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, error.error.message)),
      ).subscribe((forms: any) => {
        this.forms = forms.map((form: any) => form.label);
      }
      );
    });
  }

}
