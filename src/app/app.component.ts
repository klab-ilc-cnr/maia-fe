import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, take, throwError } from 'rxjs';
import { PopupDeleteItemComponent } from './controllers/popup/popup-delete-item/popup-delete-item.component';
import { AuthenticationService } from './services/authentication.service';
import { StorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'projectxFE';
  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("logoutWarning") public popupDeleteItem!: PopupDeleteItemComponent;

  constructor(
    private storageService: StorageService,
    private router: Router,
    private authService: AuthenticationService,
  ) { }

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
