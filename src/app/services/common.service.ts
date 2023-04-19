import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable()
export class CommonService {
  private notify = new Subject<any>();
  /**
   * Observable string streams
   */
  notifyObservable$ = this.notify.asObservable();

  public notifyOther(data: any) {
    if (data) {
      this.notify.next(data);
    }
  }

  public encodeUrl(iri: string): string {
    return iri.replace(/\//g, '%2F').replace(/:/g, '%3A').replace(/#/g, '%23');
  }
}
