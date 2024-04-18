import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LexicogEntriesRequest } from '../models/dictionary/lexicog-entries-request.model';
import { LexicogEntriesResponse } from '../models/dictionary/lexicog-entries-response.model';
import { CommonService } from './common.service';
import { LoggedUserService } from './logged-user.service';

@Injectable({
  providedIn: 'root'
})
export class DictionaryService {
  private lexoUrl: string;
  private prefix = environment.lexoPrefix;
  private encodedBaseIRI = this.commonService.encodeUrl(environment.lexoBaseIRI);
  private currentUser = this.loggedUserService.currentUser!;

  constructor(
    private http: HttpClient,
    private commonService: CommonService,
    private loggedUserService: LoggedUserService,
  ) {
    this.lexoUrl = environment.maiaBeLexoUrl;
  }

  addDictionaryEntry(lang: string, label: string) {
    return this.http.post(
      `${this.lexoUrl}/dictionary/create/entry?author=${this.currentUser.username}&prefix=${this.prefix}&baseIRI=${this.encodedBaseIRI}`,
      {
        lang: lang,
        label: label
      }
    );
  }

  retrieveLexicogEntryList(request: LexicogEntriesRequest): Observable<LexicogEntriesResponse> {
    return this.http.post<LexicogEntriesResponse>(
      `${this.lexoUrl}/data/dictionaryEntries`,
      request
    );
  }
}
