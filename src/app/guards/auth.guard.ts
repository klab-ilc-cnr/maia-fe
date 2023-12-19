import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { StorageService } from "../services/storage.service";

/**
 * Guard that checks if the user is logged in and if the jwt token has not expired, otherwise redirects to the login route 
 * @returns {true|UrlTree}
 */
export const authGuard = () => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  if (storageService.isLoggedIn()) {
    return storageService.isExpired() ? router.parseUrl('/login') : true; //if user is logged in, browsing is allowed if token is not expired
  }
  return router.parseUrl('/login');
};