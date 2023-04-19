import { CanDeactivate } from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

/**Interfaccia del componente di disattivazione di una route */
export interface ComponentCanDeactivate {
  /**
   * Interfaccia del metodo dove sono verificate le modifiche pendenti che possono bloccare la disattivazione di una route
   * @returns {boolean | Observable<boolean>}
   */
  canDeactivate: () => boolean | Observable<boolean>;
}

/**
 * Guard che gestisce la navigazione verso un altro punto dell'app. Se non sono presenti modifiche permette la disattivazione, altrimenti presenta un messaggio di conferma
 */
@Injectable()
export class PendingChangesGuard implements CanDeactivate<ComponentCanDeactivate> {
  /**
   * Implementazione del metodo che definisce se una route può essere disattivata
   * @param component {ComponentCanDeactivate} metodo di valutazione di modifiche pendenti
   * @returns {boolean | Observable<boolean>}
   */
  canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {
    // if there are no pending changes, just allow deactivation; else confirm first
    return component.canDeactivate() ?
      true :
      // NOTE: this warning message will only be shown when navigating elsewhere within your angular app;
      // when navigating away from your angular app, the browser will show a generic warning message
      // see http://stackoverflow.com/a/42207299/7307355
      confirm('ATTENZIONE: Lavoro non salvato. Premi cancel per tornare indietro e salvare il lavoro, premendo OK i cambiamenti non verranno salvati.');
  }
}