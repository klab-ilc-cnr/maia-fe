import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Observable, Subject, throwError } from 'rxjs';
import { MessageConfigurationService } from './message-configuration.service';
@Injectable()
export class CommonService {
  /**
   * Constructor for CommonService
   * @param messageService {MessageService}
   * @param msgConfService {MessageConfigurationService}
   * @param translateService {TranslateService} services to manage translation from ngx-translate
   */
  constructor(
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private translateService: TranslateService,
  ) { }

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

  private senseRelations = [
    "http://www.w3.org/2004/02/skos/core#note",
    "http://www.w3.org/ns/lemon/ontolex#usage",
    "http://www.w3.org/ns/lemon/ontolex#reference",
    "http://purl.org/dc/terms/subject",
    "http://www.w3.org/2004/02/skos/core#definition",
    "http://www.lexinfo.net/ontology/3.0/lexinfo#description",
    "http://www.lexinfo.net/ontology/3.0/lexinfo#explanation",
    "http://www.lexinfo.net/ontology/3.0/lexinfo#gloss",
    "http://www.lexinfo.net/ontology/3.0/lexinfo#senseExample",
    "http://www.lexinfo.net/ontology/3.0/lexinfo#senseTranslation",
    "http://www.lexinfo.net/ontology/3.0/lexinfo#confidence"
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

  public getSenseUpdateRelation(relation: string): string {
    return this.senseRelations.find(r => r.endsWith('#' + relation)) ?? '';
  }

  public throwHttpErrorAndMessage(error: HttpErrorResponse, message: string): Observable<never> {
    let errorMessage = '';
    try {
      errorMessage = JSON.parse(error.error).message;
    } catch (error) {
      errorMessage = message;
    }
    this.messageService.add(this.msgConfService.generateWarningMessageConfig(errorMessage));
    return throwError(() => new Error(error.error));
  }

  /**
   * Given a key, returns the corresponding string in the browser language or the default language
   * @param key {string} key in i18n files
   * @returns {string} translated string
   */
  public translateKey(key: string): string {
    return this.translateService.instant(key);
  }

  public compareArrays(a: any[], b: any[]): boolean {
    if(a.length!==b.length) return false;
    return a.every(item => b.includes(item));
  }
}
