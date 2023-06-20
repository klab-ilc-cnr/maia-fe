import { Injectable } from '@angular/core';
import { Subject, merge, of, shareReplay, switchMap } from 'rxjs';
import { LexiconService } from './lexicon.service';

/**Servizi per il recupero dello stato globale per il lessico */
@Injectable({
  providedIn: 'root'
})
export class GlobalStateService {
  /**Aggiunta di una lingua */
  addLanguage = new Subject<string>(); //sarebbe usato per gestire l'aggiunta di una lingua
  /**Observable dei tipi di forma */
  formEntryTypes$ = this.lexiconService.getFormTypes().pipe(
    shareReplay(1),
  );
  /**Observable delle lingue disponibili */
  languages$ = merge(
    this.addLanguage.pipe(
      switchMap(() => this.lexiconService.getLanguages()
      ),
    ),
    this.lexiconService.getLanguages(),
  ).pipe(
    shareReplay(1),
  );
  /**Observable dei tipi di entrate lessicali */
  lexicalEntryTypes$ = this.lexiconService.getLexicalEntryTypes().pipe(
    shareReplay(1),
  );
  /**Observable degli elementi di morfologia */
  morphologies$ = this.lexiconService.getMorphology();
  /**Observable delle pos disponibili */
  pos$ = this.morphologies$.pipe(
    switchMap(m => of(m.find(e => e.propertyId?.endsWith('#partOfSpeech'))?.propertyValues)),
    shareReplay(1),
  );
  /**Observable degli autori disponibili */
  authors$ = this.lexiconService.getAuthors().pipe(
    shareReplay(1),
  );
  /**Observable delle pos disponibili in statistica */
  statisticsPos$ = this.lexiconService.getPos().pipe(
    shareReplay(1),
  );
  /**Observable degli status disponibili secondo le statistiche */
  statisticStatuses$ = this.lexiconService.getStatus().pipe(
    shareReplay(1),
  );
  /**
   * Costruttore di GlobalStateService
   * @param lexiconService {LexiconService} servizi relativi al lessico
   */
  constructor(
    private lexiconService: LexiconService,
  ) {
    this.addLanguage.subscribe();
  }
}
