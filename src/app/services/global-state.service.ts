import { Injectable } from '@angular/core';
import { Subject, merge, of, shareReplay, switchMap } from 'rxjs';
import { LexiconService } from './lexicon.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalStateService {
  addLanguage = new Subject<string>(); //sarebbe usato per gestire l'aggiunta di una lingua
  formEntryTypes$ = this.lexiconService.getFormTypes().pipe(
    shareReplay(1),
  );
  languages$ = merge(
    this.addLanguage.pipe(
      // switchMap((l) => this.lexiconService.postLanguages(l)), //TODO questo è un esempio per gestire l'aggiornamento delle lingue a seguito di un add.
      switchMap(() => this.lexiconService.getLanguages()
      ),
    ),
    this.lexiconService.getLanguages(),
  ).pipe(
    shareReplay(1),
  );
  lexicalEntryTypes$ = this.lexiconService.getLexicalEntryTypes().pipe(
    shareReplay(1),
  );
  morphologies$ = this.lexiconService.getMorphology();
  pos$ = this.morphologies$.pipe(
    switchMap(m => of(m.find(e => e.propertyId?.endsWith('#partOfSpeech'))?.propertyValues)),
    shareReplay(1),
  );

  languages2$ = this.lexiconService.getLanguages().pipe(
    shareReplay(1),
  );

  authors$ = this.lexiconService.getAuthors().pipe(
    shareReplay(1),
  );

  statisticsPos$ = this.lexiconService.getPos().pipe(
    shareReplay(1),
  );

  statisticStatuses$ = this.lexiconService.getStatus().pipe(
    shareReplay(1),
  );

  constructor(
    private lexiconService: LexiconService,
  ) {
    this.addLanguage.subscribe();
  }
}
