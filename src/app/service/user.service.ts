import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../model/user';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {

  private usersUrl: string;

  constructor(private http: HttpClient) {
    this.usersUrl = environment.usersUrl;
  }

  public findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.usersUrl);
  }

  public retrieveById(id: string): Observable<User> {
    return this.http.get<User>(`${this.usersUrl}/${id}`);
  }

  public save(user: User) {
    return this.http.post<User>(this.usersUrl, user);
  }

  public update(user: User) {
    // TO DO: modificare per gestire l'update
    return this.http.post<User>(this.usersUrl, user);
  }
}
