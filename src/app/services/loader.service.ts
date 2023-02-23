import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private isLoading = new Subject<boolean>()

  constructor(private router: Router) {
    router.events.subscribe(
      event => {
        if (!(event instanceof NavigationEnd)) { return }
        this.isLoading.next(false)
      }
    )
  }

  /**
   * Metodo che restituisce lo status di caricamento
   * @returns {Observable<boolean>} observable che definisce se è in corso il loading o meno
   */
  getStatus() : Observable<boolean> {
    return this.isLoading.asObservable()
  }

  hide() {
    this.isLoading.next(false)
  }

  show() {
    this.isLoading.next(true)
  }
}
