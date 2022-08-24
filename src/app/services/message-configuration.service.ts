import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageConfigurationService {

  constructor() { }

  generateErrorMessageConfig(msg: string): any {
    return {
      severity: 'error',
      summary: 'Errore',
      detail: msg,
      life: 3000
    }
  }

  generateSuccessMessageConfig(msg: string): any {
    return {
      severity: 'success',
      summary: 'Successo',
      detail: msg,
      life: 3000
    }
  }
}
