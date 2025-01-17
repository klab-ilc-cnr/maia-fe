import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OntologyService {

  /**Url for texto-related requests */
  private textoUrl: string;
  commonService: any;

  /**
   * Constructor for LayerService
   * @param http {HttpClient} Performs HTTP requests
   */
  constructor(private http: HttpClient) {
    this.textoUrl = environment.maiaBeTextoUrl;
  }

  upload(file: File): Observable<any> {
    return this.http.post(
      `${this.textoUrl}/ontology/data/upload`,
      file
    )
  }
}
