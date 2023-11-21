import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageConfigurationService {

  generateErrorMessageConfig(msg: string): any {
    return {
      severity: 'error',
      summary: 'Error',
      detail: msg,
      life: 3000
    }
  }

  generateSuccessMessageConfig(msg: string): any {
    return {
      severity: 'success',
      summary: 'Success',
      detail: msg,
      life: 3000
    }
  }

  generateWarningMessageConfig(msg: string): any {
    return {
      severity: 'warn',
      summary: 'Warning',
      detail: msg,
      life: 3000
    }
  }
}
