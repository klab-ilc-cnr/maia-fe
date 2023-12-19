import {
  HTTP_INTERCEPTORS,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageService } from '../services/storage.service';

/**Class that intercepts all outgoing http calls to add the jwt token  */
@Injectable()
export class AuthenticationInterceptor implements HttpInterceptor {
  /**
   * Constructor for AuthenticationInterceptor
   * @param storageService {StorageService} services to manage the local storage
   */
  constructor(
    private storageService: StorageService,
  ) { }

  /**
   * HttpInterceptor interface method, identifies and handles a given http request
   * @param request {HttpRequest<unknown>} http request intercepted
   * @param next {HttpHandler} transform an HttpRequest into a stream of HttpEvents 
   * @returns {Observable<HttpEvent<unknown>>}
   */
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.storageService.getToken();
    const modReq = request.clone({
      headers: request.headers.set('Authorization', `Bearer ${token}`),
    });
    return next.handle(modReq);
  }
}

/**List of HttpInterceptor providers */
export const httpInterceptorProviders = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthenticationInterceptor,
    multi: true,
  },
];
