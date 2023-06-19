import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { LexicalEntryCore } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-tabs-lexical-entry',
  templateUrl: './tabs-lexical-entry.component.html',
  styleUrls: ['./tabs-lexical-entry.component.scss']
})
export class TabsLexicalEntryComponent implements OnInit {
  lexicalEntry$!: Observable<LexicalEntryCore>;
  /**Identificativo dell'entrata lessicale */
  @Input() lexicalEntryInstanceName!: string;
  selectedTab = 0;

  constructor(
    private lexiconService: LexiconService,
  ) {
  }

  ngOnInit(): void {
    this.lexicalEntry$ = this.lexiconService.getLexicalEntry(this.lexicalEntryInstanceName);
  }
}
