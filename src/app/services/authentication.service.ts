import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private maiaBeUrl = environment.allowedUrls;

  constructor(
    private http: HttpClient
  ) { }

  /**
   * POST di autenticazione su Maia-be
   * @param credentials { {username: string, password: string} } credenziali di autenticazione
   * @returns {Observable<string>} token jwt
   */
  public login(credentials: { username: string, password: string }): Observable<string> {
    return this.http.post(
      `${this.maiaBeUrl}/authentication/authenticate`,
      credentials,
      {
        responseType: 'text'
      },
    );
  }

  /**
   * POST di rinnovo del token di autenticazione
   * @param oldToken {string} token jwt scaduto
   * @returns {Observable<string>} token jwt valido
   */
  public renewToken(oldToken: string) {
    return this.http.post(
      `${this.maiaBeUrl}/authentication/renew`,
      oldToken,
      {
        responseType: 'text',
      },
    );
  }
}
