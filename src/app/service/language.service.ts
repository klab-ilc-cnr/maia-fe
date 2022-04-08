import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private languagesUrl: string;

  constructor(private http: HttpClient) {
    this.languagesUrl = environment.languagesUrl;
  }

  public retrieveAll(): Observable<string[]> {
    return this.http.get<string[]>(this.languagesUrl);
  }
}
