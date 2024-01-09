import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

/**Class of services for the loading element */
@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  /**Subject that defines whether it is loading */
  private isLoading = new Subject<boolean>()

  /**
   * Constructor for LoaderService
   * @param router {Router}  A service that provides navigation among views and URL manipulation capabilities
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
   * Method that returns the loading status
   * @returns {Observable<boolean>} observable that defines whether loading is in progress or not
   */
  getStatus() : Observable<boolean> {
    return this.isLoading.asObservable()
  }

  /**Method that makes the subject emit an end loading boolean (hide element) */
  hide() {
    this.isLoading.next(false)
  }

  /**Method that makes the subject output a boolean start loading (hide element) */
  show() {
    this.isLoading.next(true)
  }
}
