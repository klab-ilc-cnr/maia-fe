import { EventsConstants } from 'src/app/constants/events-constants';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { catchError, take, throwError } from 'rxjs';
import { guardAgainstStuckJsPanelModifier } from './helpers/jspanel-modifier';
import { guardAgainstStuckTextSelection } from './helpers/stuck-text-selection';
import { PopupDeleteItemComponent } from './controllers/popup/popup-delete-item/popup-delete-item.component';
import { AuthenticationService } from './services/authentication.service';
import { SessionService } from './services/session.service';
import { StorageService } from './services/storage.service';
import Swal from 'sweetalert2';
import { CommonService } from './services/common.service';

/**Basic component of the application */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false
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
    public commonService: CommonService,
    private sessionService: SessionService,
    private ngZone: NgZone,
  ) {
    translate.addLangs(['en', 'it']);
    translate.setDefaultLang('en');
    const browserLang: string = translate.getBrowserLang() ?? translate.getDefaultLang();
    translate.use(browserLang);
  }

  /**OnInit interface method, used to intercept the token expiration subject */
  ngOnInit(): void {
    this.storageService.tokenTimeout.subscribe(() => {
      // 30 s before the end of the session the token is still valid: the open workspace (if any) saves its layout now,
      // after the expiration the save would fail and the layout would be lost
      this.commonService.notifyOther({ option: EventsConstants.saveWorkspaceBeforeLogoutEvent, value: null });
      this.popupDeleteItem.showLogoutWarming(
        () => {
          console.info('call renew');
          this.refreshToken();
        },
        () => {
          // the user refused to continue: save again (changes made while the warning was open) before the token is removed
          this.commonService.notifyOther({ option: EventsConstants.saveWorkspaceBeforeLogoutEvent, value: null });
          this.storageService.cleanStorage();
          this.router.navigate(['/login']);
        });
    });

    // the warning timer lives only in memory: after a reload (F5) it must be set again from the stored expiration
    this.storageService.scheduleExpirationWarning();
    // after a long time in the background (or the computer sleeping) the token may have expired meanwhile
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.sessionService.checkExpired();
      }
    });

    // a dialog closed while being dragged leaves the whole page without text selection
    guardAgainstStuckTextSelection(this.ngZone);
    guardAgainstStuckJsPanelModifier(this.ngZone);

    this.checkBroser();
  }

  private checkBroser() {
    var isChromium = !!(navigator as any).userAgentData && (navigator as any).userAgentData.brands.some((data: { brand: string; }) => data.brand == 'Chromium');

    setTimeout(() => {
      if (!isChromium) {
        const warningMessage = this.commonService.translateKey('GENERAL.browserWarning');
        Swal.fire({
          icon: 'warning',
          titleText: warningMessage,
          showConfirmButton: true,
          customClass: {
            confirmButton: "swalDangerButton"
          },
          confirmButtonText: "Ok"
        });
      };
    }, 500);
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
