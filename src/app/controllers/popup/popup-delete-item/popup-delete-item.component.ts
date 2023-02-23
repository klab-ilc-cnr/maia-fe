import { Component, Input, OnInit } from '@angular/core';
import { ElementType } from 'src/app/models/corpus/element-type';
import Swal from 'sweetalert2';

/**Componente del popup di conferma cancellazione con codice */
@Component({
  selector: 'app-popup-delete-item',
  templateUrl: './popup-delete-item.component.html', //TODO template vuoto, si potrebbe rimuovere?
  styleUrls: ['./popup-delete-item.component.scss']
})
export class PopupDeleteItemComponent implements OnInit {

  /**Codice di conferma alla cancellazione */
  private confirmCode: string | undefined;

  /**Input, messaggio di conferma */
  @Input() public confirmMessage: string | undefined;
  /**Input messaggio di avviso/allerta */
  @Input() public warningMessage: string | undefined;

  /**Costruttore per PopupDeleteItemComponent */
  constructor() { }

  /**
   * @private
   * Getter del messaggio di conferma cancellazione con codice
   */
  private get codeConfirmMessage(): string {
    this.confirmCode = this.generateConfirmCode();

    let msg = "Inserire la seguente sequenza di cifre per confermare la cancellazione:"
    if (!this.warningMessage) {
      return `${msg}<br><h3>${this.confirmCode}</h3>`
    }

    return `${this.warningMessage}<br>${msg}<br><h3>${this.confirmCode}</h3>`;
  }

  //TODO rimozione per mancato utilizzo?
  /**Metodo dell'interfaccia OnInit */
  public ngOnInit(): void {
  }

  /**
   * Metodo che visualizza il popup swal di conferma della cancellazione di un elemento ed eventualmente ne lancia la funzione di cancellazione
   * @param deleteFn {} funzione per la cancellazione di un elemento
   * @param id {any} identificativo dell'elemento
   * @param name {string} nome dell'elemento
   * @param type {ElementType} tipo di elemento da cancellare
   */
  public showDeleteConfirm(deleteFn: (id: any, name?: string, type?: ElementType) => void, id?: any, name?: string, type?: ElementType): void {
    Swal.fire({
      icon: 'warning',
      input: 'text',
      titleText: this.confirmMessage,
      html: this.codeConfirmMessage,
      showCancelButton: true,
      showConfirmButton: true,
      customClass: {
        confirmButton: "swalDangerButton"
      },
      confirmButtonText: "Sono sicuro elimina",
      cancelButtonText: "Annulla",
      inputValidator: (value) => {
        return new Promise((resolve) => {
          if (value === this.confirmCode) {
            resolve(null);
          } else {
            resolve("La sequenza di cifre non corrisponde");
          }
        })
      }
    }).then((result) => {
      if (result.isConfirmed && id) {
        deleteFn(id, name, type);
      }
      else {
        this.swalOperationCancelled("Cancellazione Annullata");
      }
    });
  }

  /**
   * @private
   * Metodo che genera un codice di conferma della cancellazione random
   * @returns {string} codice per la conferma
   */
  private generateConfirmCode(): string {
    return ((Math.random() * (9999)).toFixed(0)).toString().padEnd(4, '0');
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
