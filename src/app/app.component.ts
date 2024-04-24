import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, take, throwError } from 'rxjs';
import { PopupDeleteItemComponent } from './controllers/popup/popup-delete-item/popup-delete-item.component';
import { AuthenticationService } from './services/authentication.service';
import { StorageService } from './services/storage.service';

/**Basic component of the application */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'projectxFE';
  /**Reference to logout confirmation popup */
  @ViewChild("logoutWarning") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Constructor for AppComponent
   * @param storageService {StorageService} services to manage the local storage
   * @param router {Router}  service that provides navigation among views and URL manipulation capabilities
   * @param authService {AuthenticationService} services for authentication and jwt token management
   * @param translate {TranslateService} services to manage i18n
   */
  constructor(
    private storageService: StorageService,
    private router: Router,
    private authService: AuthenticationService,
    public translate: TranslateService,
  ) {
    translate.addLangs(['en', 'it']);
    translate.setDefaultLang('en');
    const browserLang: string = translate.getBrowserLang() ?? translate.getDefaultLang();
    translate.use(browserLang);
  }

  /**OnInit interface method, used to intercept the token expiration subject */
  ngOnInit(): void {
    this.storageService.tokenTimeout.subscribe(() => {
      this.popupDeleteItem.showLogoutWarming(
        () => {
          console.info('call renew');
          this.refreshToken();
      },
      () => {
        this.storageService.cleanStorage();
        this.router.navigate(['/login']);    
      });
    })
  }

  /**Private method that invokes jwt token refresh */
  private refreshToken() {
    this.authService.renewToken(this.storageService.getToken()!).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.storageService.cleanStorage();
        this.router.navigate(['/login']);    
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(resp => {
      this.storageService.setToken(resp);
      this.storageService.setExpiration();
    });
  }
}
