import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

/**Authentication service class and jwt token management */
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  /**Url of maia-be */
  private maiaBeUrl = environment.allowedUrls;

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
