import { Injectable } from '@angular/core';
import { LexiconService } from './lexicon.service';
import { Subject, merge, of, shareReplay, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalStateService {
  addLanguage = new Subject<string>(); //sarebbe usato per gestire l'aggiunta di una lingua
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

  constructor(
    private lexiconService: LexiconService,
  ) {
    this.addLanguage.subscribe();
  }
}
