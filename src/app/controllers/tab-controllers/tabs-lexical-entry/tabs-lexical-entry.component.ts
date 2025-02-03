import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { LexicalEntryCore, LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconService } from 'src/app/services/lexicon.service';
import { environment } from 'src/environments/environment';
/**Componente dei tab per la lavorazione di un'entrata lessicale */
@Component({
  selector: 'app-tabs-lexical-entry',
  templateUrl: './tabs-lexical-entry.component.html',
  styleUrls: ['./tabs-lexical-entry.component.scss']
})
export class TabsLexicalEntryComponent implements OnInit {
  demoHide = environment.demoHide;
  /**Observable dell'entrata lessicale */
  lexicalEntry$!: Observable<LexicalEntryCore>;
  /**Identificativo dell'entrata lessicale */
  @Input() lexicalEntryInstanceName!: string;
  /**Tab iniziale selezionato */
  selectedTab = 0;
  LEXICAL_ENTRY_TYPE = LexicalEntryType;

 /**
  * Costruttore per TabsLexicalEntryComponent
  * @param lexiconService {LexiconService} servizi relativi al lessico
  */
  constructor(
    private lexiconService: LexiconService,
  ) {
  }

  /**Metodo dell'interfaccia OnInit, utilizzato per il recupero dei dati iniziali */
  ngOnInit(): void {
    this.lexicalEntry$ = this.lexiconService.getLexicalEntry(this.lexicalEntryInstanceName);
  }
}
