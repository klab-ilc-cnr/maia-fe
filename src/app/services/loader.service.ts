import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

/**Classe dei servizi per l'elemento di loading */
@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  /**Subject che definisce se sta caricando */
  private isLoading = new Subject<boolean>()

  /**
   * Costruttore per LoaderService
   * @param router {Router} servizi per la navigazione fra le viste
   */
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

  /**Metodo che causa un'emissione del subject di fine loading (nascondi elemento) */
  hide() {
    this.isLoading.next(false)
  }

  /**Metodo che causa un'emissione del subject di inizio caricamento (mostra elemento) */
  show() {
    this.isLoading.next(true)
  }
}
