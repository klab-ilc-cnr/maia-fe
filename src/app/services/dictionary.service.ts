import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LexicogEntriesResponse } from '../models/dictionary/lexicog-entries-response.model';

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {
  private lexoUrl: string;

  constructor(
    private http: HttpClient
  ) {
    this.lexoUrl = environment.maiaBeLexoUrl;
  }

  retrieveLexicogEntryList(): Observable<LexicogEntriesResponse> {
    // return this.http.post<LexicogEntriesResponse>(
    //   `${this.lexoUrl}/lexicon/data/dictionaryEntries`,
    //   <LexicogEntriesRequest>{ //FIXME da sostituire con un body passato, serve solo per il test preliminare
    //     text: '',
    //     searchMode: searchModeEnum.startsWith,
    //     pos: '',
    //     author: '',
    //     lang: '',
    //     status: '',
    //     offset: 0,
    //     limit: 0
    //   }
    // );
    return this.http.get<LexicogEntriesResponse>('assets/mock/dictionary/lexicog-entries.json'); //FIXME replace with backend service
  }
}
