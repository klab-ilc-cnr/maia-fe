import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, EMPTY, Observable, timeout } from 'rxjs';
import { environment } from 'src/environments/environment';

/**Authentication service class and jwt token management */
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  /**Url of maia-be */
  private maiaBeUrl = environment.maiaBeUrl;

  /**
   * Constructor for AuthenticationService
   * @param http {HttpClient} service that performs http requests
   */
  constructor(
    private http: HttpClient
  ) { }

  /**
   * POST Method that performs authentication
   * @param credentials { {username: string, password: string} } authentication credentials
   * @returns {Observable<string>} jwt token
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
   * Tells maia-be that the user chose "Logout" (`POST /authentication/logout`, current jwt, no body; 204 or 401). It is only
   * an audit event: it does not revoke the token. It is "fire and forget": the caller does not wait for it, any error or
   * delay (3 s at most) is ignored, and nothing here can start a renewal or show "session expired". The subscription belongs
   * to no component, so leaving the page does not cancel the request. Call it BEFORE the token is removed (the
   * interceptor reads it when the request starts).
   */
  public notifyLogout(): void {
    this.http.post(`${this.maiaBeUrl}/authentication/logout`, null, { responseType: 'text' }).pipe(
      timeout(3000),
      catchError(() => EMPTY),
    ).subscribe();
  }

  /**
   * POST of authentication token renewal
   * @param oldToken {string} expired jwt token
   * @returns {Observable<string>} valid jwt token
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
