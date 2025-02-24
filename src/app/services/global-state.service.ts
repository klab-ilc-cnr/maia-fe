import { Injectable } from '@angular/core';
import { Subject, map, merge, of, shareReplay, switchMap } from 'rxjs';
import { LexiconService } from './lexicon.service';

/**Service class for global lexicon status management */
@Injectable({
  providedIn: 'root'
})
export class GlobalStateService {
  /**Subject for adding a language */
  addLanguage = new Subject<string>(); //sarebbe usato per gestire l'aggiunta di una lingua
  /**Observable of the form type list */
  formEntryTypes$ = this.lexiconService.getFormTypes().pipe(
    shareReplay(1),
  );
  /**Observable of available languages */
  languages$ = merge(
    this.addLanguage.pipe(
      switchMap(() => this.lexiconService.getLanguages()
      ),
    ),
    this.lexiconService.getLanguages(),
  ).pipe(
    shareReplay(1),
  );
  statLanguages$ = this.lexiconService.getLanguagesStatistics().pipe(
    shareReplay(1),
  );
  marksOfUse$ = this.lexiconService.getLexicalConcepts('marcheDUso').pipe(
    map(resp => resp.list),
    shareReplay(1),
  );
  semanticMarks$ = this.lexiconService.getLexicalConcepts('marcheSemantiche').pipe(
    map(resp => resp.list),
    shareReplay(1),
  );
  grammaticalMarks$ = this.lexiconService.getLexicalConcepts('marcheGrammaticali').pipe(
    map(resp => resp.list),
    shareReplay(1),
  );
  /**Observable of the list of lexical entry types */
  lexicalEntryTypes$ = this.lexiconService.getLexicalEntryTypes().pipe(
    shareReplay(1),
  );
  lexicalEntryStatTypes$ = this.lexiconService.getStatTypes().pipe(
    shareReplay(1)
  );
  /**Observable of the list of morphology elements. */
  morphologies$ = this.lexiconService.getMorphology();
  /**Observable of the list of available POS */
  pos$ = this.morphologies$.pipe(
    switchMap(m => of(m.find(e => e.propertyId?.endsWith('#partOfSpeech'))?.propertyValues)),
    shareReplay(1),
  );
  /**Observable of the list of available authors */
  authors$ = this.lexiconService.getAuthors().pipe(
    shareReplay(1),
  );
  /**Observable of pos available in statistics */
  statisticsPos$ = this.lexiconService.getPos().pipe(
    shareReplay(1),
  );
  /**Observable of available statuses according to statistics */
  statisticStatuses$ = this.lexiconService.getStatus().pipe(
    shareReplay(1),
  );
  /**
   * Costructor for GlobalStateService
   * @param lexiconService {LexiconService} lexicon-related services
   */
  constructor(
    private lexiconService: LexiconService,
  ) {
    this.addLanguage.subscribe();
  }
}
