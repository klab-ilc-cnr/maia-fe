import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DropdownField } from 'src/app/models/dropdown-field';
import { LexicalEntryCore } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-tabs-lexical-entry',
  templateUrl: './tabs-lexical-entry.component.html',
  styleUrls: ['./tabs-lexical-entry.component.scss']
})
export class TabsLexicalEntryComponent implements OnInit {
  lexicalEntry$!: Observable<LexicalEntryCore>;
  lexicalEntryCore!: LexicalEntryCore;
  /**Lista delle option per i tipi di entrata lessicale */
  @Input() lexicalEntryTypes!: DropdownField[];
  /**Lista delle option per le POS */
  @Input() partOfSpeeches!: DropdownField[];
  /**Lista delle option per i valori della lingua */
  @Input() languageValues!: DropdownField[];
  /**Identificativo dell'entrata lessicale */
  @Input() lexicalEntryInstanceName!: string;

  constructor(
    private lexiconService: LexiconService
  ) {
    // this.lexicalEntry$ = this.lexiconService.getLexicalEntry(this.lexicalEntryInstanceName);
  }

  ngOnInit(): void {
      this.lexicalEntry$ = this.lexiconService.getLexicalEntry(this.lexicalEntryInstanceName);
  }
}
