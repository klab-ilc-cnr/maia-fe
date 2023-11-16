import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user';

/**Classe dei servizi relativi agli utenti */
@Injectable({
  providedIn: 'root',
})
export class UserService {

  /**Url per le chiamate relative agli utenti */
  private usersUrl: string;

  /**
   * Costruttore per UserService
   * @param http {HttpClient} effettua le chiamate HTTP
   */
  constructor(private http: HttpClient) {
    this.usersUrl = environment.usersUrl; //recupero l'url dall'environment
  }

  /**
   * GET per il recupero della lista di tutti gli utenti
   * @returns {Observable<User[]>} observable della lista completa degli utenti
   */
  public findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.usersUrl);
  }

  /**
   * GET che recupera i dati di un dato utente utilizzando il suo id
   * @param id {string} identificativo dell'utente
   * @returns {Observable<User>} observable dell'utente recuperato
   */
  public retrieveById(id: string): Observable<User> {
    return this.http.get<User>(`${this.usersUrl}/${id}`);
  }

  /**
   * GET per il recupero dei dati dell'utente loggato
   * @returns {Observable<User>} observable dei dati dell'utente loggato
   */
  public retrieveCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.usersUrl}/current`);
  }

  /**
   * POST per la creazione di un nuovo utente
   * @param user {User} nuovo utente
   * @returns {Observable<User>} observable del nuovo utente
   */
  public save(user: User) {
    return this.http.post<User>(this.usersUrl, user);
  }

  /**
   * PUT che aggiorna i dati di un utente
   * @param user {User} utente con i dati aggiornati
   * @returns {Observable<User>} utente aggiornato
   */
  public update(user: User) {
    return this.http.put<User>(this.usersUrl, user);
  }

  public updatePassword(pwdBody: { id?: number, newPassword: string, currentPassword?: string }): Observable<User> {
    return this.http.post<User>(
      `${this.usersUrl}/password`,
      pwdBody,
    );
  }
}
