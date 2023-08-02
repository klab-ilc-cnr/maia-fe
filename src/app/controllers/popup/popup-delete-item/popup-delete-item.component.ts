import { Component, Input } from '@angular/core';
import { _ElementType } from 'src/app/models/corpus/element-type';
import Swal from 'sweetalert2';

/**Componente del popup di conferma cancellazione con codice */
@Component({
  selector: 'app-popup-delete-item',
  templateUrl: './popup-delete-item.component.html', //TODO template vuoto, si potrebbe rimuovere?
  styleUrls: ['./popup-delete-item.component.scss']
})
export class PopupDeleteItemComponent {

  /**Input, messaggio di conferma */
  @Input() public confirmMessage: string | undefined;
  /**Input messaggio di avviso/allerta */
  @Input() public warningMessage: string | undefined;

  /**
   * Metodo che visualizza il popup swal di conferma della cancellazione di un elemento ed eventualmente ne lancia la funzione di cancellazione
   * @param deleteFn {} funzione per la cancellazione di un elemento
   * @param id {any} identificativo dell'elemento
   * @param name {string} nome dell'elemento
   * @param type {_ElementType} tipo di elemento da cancellare
   */
  public showDeleteConfirm(deleteFn: (id: any, name?: string, type?: _ElementType) => void, id?: any, name?: string, type?: _ElementType): void {
    Swal.fire({
      icon: 'warning',
      titleText: this.confirmMessage,
      showCancelButton: true,
      showConfirmButton: true,
      customClass: {
        confirmButton: "swalDangerButton"
      },
      confirmButtonText: "I'm sure, delete",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed && id) {
        deleteFn(id, name, type);
      }
      else {
        this.swalOperationCancelled("Cancellation Cancelled");
      }
    });
  }

  public showDeleteConfirmSimple(deleteFn: () => void) {
    Swal.fire({
      icon: 'warning',
      titleText: this.confirmMessage,
      showCancelButton: true,
      showConfirmButton: true,
      customClass: {
        confirmButton: "swalDangerButton"
      },
      confirmButtonText: "I'm sure, delete",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteFn();
      }
      else {
        this.swalOperationCancelled("Cancellation Cancelled");
      }
    });
  }

  /**
   * @private
   * Metodo che visualizza il popup di annullamento della cancellazione dell'elemento
   * @param message {string} messaggio di errore
   */
  private swalOperationCancelled(message: string): void {
    Swal.fire({
      icon: 'error',
      title: message,
      showConfirmButton: true,
      customClass: {
        confirmButton: "swalOkButton"
      }
    });
  }

}
