import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OntologyService {

  /**Url for texto-related requests */
  private lexoUrl: string;
  commonService: any;

  /**
   * Constructor for LayerService
   * @param http {HttpClient} Performs HTTP requests
   */
  constructor(private http: HttpClient) {
    this.lexoUrl = environment.maiaBeLexoUrl;
  }

  getDirectSubClasses(classId?: string): Observable<any> {
    if (classId) {
      return this.http.get(`${this.lexoUrl}/ontology/data/classes?direct=true&classId=${classId}`);
    }

    return this.http.get(`${this.lexoUrl}/ontology/data/classes?direct=true`);
  }

  /**
   * Upload an ontology file
   * @param fileInForm 
   * @returns 
   */
  upload(fileInForm: FormData): Observable<any> {
    return this.http.post(
      `${this.lexoUrl}/ontology/data/upload`,
      fileInForm
    )
  }
}
