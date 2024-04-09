import { Injectable } from '@angular/core';
import { map, merge, shareReplay } from 'rxjs';
import { DictionaryService } from './dictionary.service';

@Injectable({
  providedIn: 'root'
})
export class DictionaryStateService {

  constructor(
    private dictionaryService: DictionaryService,
  ) { }

  lexicogListResponse$ = merge(
    this.dictionaryService.retrieveLexicogEntryList(),
  ).pipe(
    shareReplay(1),
  );

  lexicogEntries$ = this.lexicogListResponse$.pipe(
    map(resp => resp.list),
    shareReplay(1),
  );

  totalHits$ = this.lexicogListResponse$.pipe(
    map(resp => resp.totalHits),
    shareReplay(1),
  );
}
