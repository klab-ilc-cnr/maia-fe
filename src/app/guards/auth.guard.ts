import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { StorageService } from "../services/storage.service";

export const authGuard = () => {
  const storageService = inject(StorageService);
  const router = inject(Router);
  if (storageService.isLoggedIn()) {
    return true;
  }
  return router.parseUrl('/login');
};