import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { LoggedUserService } from "../services/logged-user.service";

/**
 * Guard for the pages reserved to the administrators: anybody else is sent to the home page. It only avoids showing a page
 * that cannot work: the real check is the one of the server (403).
 * @returns {true|UrlTree}
 */
export const canManageUsersGuard = () => {
  return inject(LoggedUserService).canManageUsers() ? true : inject(Router).parseUrl('/');
};
