import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { OntologyClass } from '../models/ontology/ontology-class.model';
import { OntologyIndividual } from '../models/ontology/ontology-individual.model';
import { OntologyDataProperty } from '../models/ontology/ontology-data-property.model';
import { OntologyObjectProperty } from '../models/ontology/ontology-object-property.model';

export enum SubPropertyType {
  object = "object",
  data = "data"
}

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

  /**
   * Get subclasses in the ontology
   * @param classId 
   * @returns 
   */
  getDirectSubClasses(classId?: string): Observable<OntologyClass[]> {
    if (classId) {
      return this.http.get<OntologyClass[]>(`${this.lexoUrl}/ontology/data/classes?id=${encodeURIComponent(classId)}&direct=true`);
    }

    return this.http.get<OntologyClass[]>(`${this.lexoUrl}/ontology/data/classes?direct=true`);
  }

  /**
 * Get subproperties in the ontology
 * @param classId 
 * @returns 
 */
  getSubProperties(type: SubPropertyType, propertyId?: string): Observable<OntologyDataProperty[] | OntologyObjectProperty[]> {
    if (propertyId) {
      return this.http.get<OntologyDataProperty[] | OntologyObjectProperty[]>(`${this.lexoUrl}/ontology/data/properties?id=${encodeURIComponent(propertyId)}&direct=true&type=${type}`);
    }

    return this.http.get<OntologyDataProperty[] | OntologyObjectProperty[]>(`${this.lexoUrl}/ontology/data/properties?direct=true&type=${type}`);
  }

  /**
* Get individual in the ontology
* @param individualId 
* @returns 
*/
  getIndividuals(individualId?: string): Observable<OntologyIndividual[]> {
    if (individualId) {
      return this.http.get<OntologyIndividual[]>(`${this.lexoUrl}/ontology/data/individuals?id=${encodeURIComponent(individualId)}`);
    }

    return this.http.get<OntologyIndividual[]>(`${this.lexoUrl}/ontology/data/individuals`);
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
