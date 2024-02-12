import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, shareReplay } from 'rxjs';
import { CommonService } from './common.service';
import { SystemService } from './system.service';

@Injectable({
  providedIn: 'root'
})
export class SystemStateService {
  lexoSystemInfo$ = this.systemService.retrieveLexoSystemInfo().pipe(
    map(resp => resp),
    catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, 'Error retrieving LexO system info')),
    shareReplay(1),
  );
  maiaSystemEnvironment$ = this.systemService.retrieveMaiaSystemEnvironment().pipe(
    map(resp => resp),
    catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, 'Error retrieving maia-be system environment')),
    shareReplay(1),
  );
  maiaSystemInfo$ = this.systemService.retrieveMaiaSystemInfo().pipe(
    map(resp => resp),
    catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, 'Error retrieving maia-be system info')),
    shareReplay(1),
  );
  textoSystemEnvironment$ = this.systemService.retrieveTextoSystemEnvironment().pipe(
    map(resp => resp),
    catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, 'Error retrieving Texto system environment')),
    shareReplay(1),
  );
  textoSystemInfo$ = this.systemService.retrieveTexoSystemInfo().pipe(
    map(resp => resp),
    catchError((error: HttpErrorResponse) => this.commonService.throwHttpErrorAndMessage(error, 'Error retrieving Texto system info')),
    shareReplay(1),
  );

  constructor(
    private systemService: SystemService,
    private commonService: CommonService,
  ) { }
}
