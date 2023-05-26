import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable()
export class CommonService {
  private notify = new Subject<any>();
  /**
   * Observable string streams
   */
  notifyObservable$ = this.notify.asObservable();

  private formRelations = [
    "http://www.w3.org/2004/02/skos/core#note",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type",
    "http://www.w3.org/ns/lemon/ontolex#writtenRep",
    "http://www.w3.org/ns/lemon/ontolex#phoneticRep",
    "http://www.lexinfo.net/ontology/3.0/lexinfo#pronunciation",
    "http://www.lexinfo.net/ontology/3.0/lexinfo#segmentation",
    "http://www.lexinfo.net/ontology/3.0/lexinfo#transliteration",
    "http://www.lexinfo.net/ontology/3.0/lexinfo#romanization",
    "http://www.lexinfo.net/ontology/3.0/lexinfo#confidence",
  ];

  public notifyOther(data: any) {
    if (data) {
      this.notify.next(data);
    }
  }

  public encodeUrl(iri: string): string {
    return iri.replace(/\//g, '%2F').replace(/:/g, '%3A').replace(/#/g, '%23');
  }

  public getFormUpdateRelation(relation: string): string {
    return this.formRelations.find(r => r.endsWith('#' + relation)) ?? '';
  }
}
