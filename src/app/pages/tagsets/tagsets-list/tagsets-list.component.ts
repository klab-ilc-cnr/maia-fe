import { LoaderService } from 'src/app/services/loader.service';
import { Tagset } from './../../../models/tagset/tagset';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { TagsetService } from 'src/app/services/tagset.service';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';

@Component({
  selector: 'app-tagsets-list',
  templateUrl: './tagsets-list.component.html',
  styleUrls: ['./tagsets-list.component.scss']
})
export class TagsetsListComponent implements OnInit {
  private delete = (id: number, name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare il tagset \'' + name + '\'';
    let successMsg = 'Tagset \'' + name + '\' eliminato con successo';

    this.tagsetService
        .delete(id)
        .subscribe({
          next: (result) => {
            if (result) {
              this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
              Swal.close();
            }
            else {
              console.log('hi')
              this.showOperationFailed('Cancellazione Fallita: ' + errorMsg);
            }
            this.loadData();
          },
          error: () => {
            this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
          }
        })
  }

  public get isEditing(): boolean {
    if (this.tagsetModel && this.tagsetModel.id) {
      return true;
    }

    return false;
  }

  tagsets: Tagset[] = [];
  tagsetModel: Tagset = new Tagset();

  @ViewChild(NgForm) public tagsetForm!: NgForm;
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  constructor(
    private loaderService: LoaderService,
    private tagsetService: TagsetService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private activeRoute: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    Swal.close();
  }

  navigateTo(event: any) {
    const item = event.data;
    this.router.navigate([item.id], { relativeTo: this.activeRoute });
  }

  onNew(): void {
    this.router.navigate(["new"], { relativeTo: this.activeRoute });
	}

  onEdit(tagset: Tagset): void {
    this.router.navigate([tagset.id], { relativeTo: this.activeRoute });
  }

  onDelete(tagset: Tagset): void {
    let confirmMsg = 'Stai per cancellare il tagset \'' + tagset.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(tagset.id, (tagset.name || "")), tagset.id, tagset.name);
  }

  private loadData() {
    this.loaderService.show();

    this.tagsetService.retrieve()
      .subscribe({
        next: (data) => {
          this.tagsets = [...data];
          this.loaderService.hide();
        }
      })
  }

  private showOperationFailed(errorMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: errorMessage,
      showConfirmButton: true
    });
  }

  private showOperationInProgress(message: string): void {
    Swal.fire({
      icon: 'warning',
      titleText: message,
      text: 'per favore attendere',
      customClass: {
        container: 'swal2-container'
      },
      showCancelButton: false,
      showConfirmButton: false
    });
  }

}
