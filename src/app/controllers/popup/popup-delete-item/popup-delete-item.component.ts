import { Component, Input, OnInit } from '@angular/core';
import { ElementType } from 'src/app/model/tile/element-type';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-popup-delete-item',
  templateUrl: './popup-delete-item.component.html',
  styleUrls: ['./popup-delete-item.component.scss']
})
export class PopupDeleteItemComponent implements OnInit {

  private confirmCode: string | undefined;

  @Input() public confirmMessage: string | undefined;
  @Input() public warningMessage: string | undefined;

  constructor() { }

  private get codeConfirmMessage(): string {
    this.confirmCode = this.generateConfirmCode();

    let msg = "Inserire la seguente sequenza di cifre per confermare la cancellazione:"
    if (!this.warningMessage) {
      return `${msg}<br><h3>${this.confirmCode}</h3>`
    }

    return `${this.warningMessage}<br>${msg}<br><h3>${this.confirmCode}</h3>`;
  }

  public ngOnInit(): void {
  }

  public showDeleteConfirm(deleteFn: (id: number, name: string, type: ElementType) => void, id?: number, name?: string, type?: ElementType): void {
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
      if (result.isConfirmed && id && name && type) {
        deleteFn(id, name, type);
      }
      else {
        this.swalOperationCancelled("Cancellazione Annullata");
      }
    });
  }

  private generateConfirmCode(): string {
    return ((Math.random() * (9999)).toFixed(0)).toString().padEnd(4, '0');
  }

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
