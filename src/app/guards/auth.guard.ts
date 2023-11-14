import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { StorageService } from "../services/storage.service";

export const authGuard = () => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  if (storageService.isLoggedIn()) {
    return storageService.isExpired() ? router.parseUrl('/login') : true; //if user is logged in, browsing is allowed if token is not expired
  }
  return router.parseUrl('/login');
};