import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { Tagset } from 'src/app/models/tagset/tagset';
import { TagsetValue } from 'src/app/models/tagset/tagset-value';
import { LoaderService } from 'src/app/services/loader.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { TagsetService } from 'src/app/services/tagset.service';
import Swal from 'sweetalert2';

declare var $: any;

@Component({
  selector: 'app-tagset-create-edit',
  templateUrl: './tagset-create-edit.component.html',
  styleUrls: ['./tagset-create-edit.component.scss']
})
export class TagsetCreateEditComponent implements OnInit {
  private deleteTagset = (id: number, name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare il tagset \'' + name + '\'';
    let successMsg = 'Tagset \'' + name + '\' eliminato con successo';

    this.tagsetService
        .delete(id)
        .subscribe({
          next: (result) => {
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
            Swal.close();
            this.back();
          },
          error: () => {
            this.showOperationFailed('Cancellazione Fallita: ' + errorMsg);
          }
        })
  }

  private deleteValue = (name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nel rimuovere il valore \'' + name + '\'';
    let successMsg = 'Valore \'' + name + '\' rimosso con successo';

    let i = this.tagsetModel.values!.findIndex((item: any) => item.originalName == name);

    if (!this.tagsetModel.values || i < 0) {
      this.showOperationFailed('Cancellazione Fallita: ' + errorMsg);
      Swal.close();
      return;
    }

    this.areTagsetValuesChanged = true;

    this.tagsetModel.values.splice(i, 1);
    Swal.close();
  }

  public get isEditing(): boolean {
    if (this.tagsetModel && this.tagsetModel.id) {
      return true;
    }

    return false;
  }

  public get isTagsetValueEditing(): boolean {
    if (this.tagsetValueModel && this.tagsetValueModel.originalName && this.tagsetValueModel.name) {
      return true;
    }

    return false;
  }

  public get tagsetValueModalTitle(): string {
    if (((!this.tagsetValueForm) || (!this.tagsetValueForm.value)) || (!this.tagsetValueForm.value.name)) {
    if (((!this.tagsetValueForm) || (!this.tagsetValueForm.value)) || (!this.tagsetValueForm.value.tvName)) {
      return "Nuovo valore del tagset";
    }

    return this.tagsetValueForm.value.tvName;
  }

  public get title(): string {
    if (((!this.tagsetForm) || (!this.tagsetForm.value)) || (!this.tagsetForm.value.name)) {
      return "Nuovo tagset";
    }

    return this.tagsetForm.value.name;
  }

  newId: string = "new"
  tagsetModel: Tagset = new Tagset();
  tagsetValueModel: TagsetValue = new TagsetValue();
  areTagsetValuesChanged: boolean = false;

  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;
  @ViewChild("tagsetForm") public tagsetForm!: NgForm;
  @ViewChild("tagsetValueForm") public tagsetValueForm!: NgForm;

  constructor(
    private loaderService: LoaderService,
    private tagsetService: TagsetService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private activeRoute: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.activeRoute.paramMap.subscribe({
      next: (params) => {
        const id = params.get('id');

        if (id == null) {
          this.back();
        }
        else if (id != this.newId) {
          this.loadData(Number.parseInt(id));
        }
        else {
          this.tagsetModel.values = [];
        }
      }
    });
  }

  ngOnDestroy(): void {
    Swal.close();
  }

  back() {
    this.router.navigate(['tagsets']);
  }

  showDeleteModal(tagset: Tagset): void {
    let confirmMsg = 'Stai per cancellare il tagset \'' + tagset.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteTagset(tagset.id, (tagset.name || "")), tagset.id, tagset.name);
  }

  showDeleteValueModal(value: TagsetValue): void {
    let confirmMsg = 'Stai per cancellare il valore \'' + value.originalName + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteValue((value.originalName || "")), value.originalName);
  }

  showEditValueModal(value: TagsetValue): void {
    this.resetForm();
    this.tagsetValueModel = JSON.parse(JSON.stringify(value));
    $('#tagsetValueModal').modal('show');
  }

  showTagsetValueModal() {
    this.resetForm();
    $('#tagsetValueModal').modal('show');
  }

  onSubmitTagsetForm(form: NgForm): void {
    if (this.tagsetForm.invalid) {
      return this.saveWithFormErrors();
    }

    this.save();
  }

  onSubmitTagsetValueModal(form: NgForm): void {
    if (this.tagsetValueForm.invalid) {
      return this.saveTagsetValueWithFormErrors();
    }

    this.saveTagsetValue();
  }

  private findTagsetValueByName(name: string) {
    let v = this.tagsetModel.values?.find((item: any) => item.name == name)

    return v;
  }

  private loadData(id: number) {
    this.loaderService.show();
    this.tagsetService.retrieveById(id)
      .subscribe({
        next: (tagset) => {
          var model = Object.assign(new Tagset(), tagset);
          this.tagsetModel = model;

          if (!this.tagsetModel.values) {
            this.tagsetModel.values = [];
          }

          let valuesCopy = JSON.parse(JSON.stringify(this.tagsetModel.values));

          this.tagsetModel.values = [];

          valuesCopy.forEach((v: any) => {
            this.tagsetModel.values?.push({ ...v, originalName: v.name })
          })

          console.log(this.tagsetModel)

          this.loaderService.hide();
        }
      })
  }

  private resetForm() {
    this.tagsetValueModel = new TagsetValue();
    this.tagsetValueForm.form.markAsUntouched();
    this.tagsetValueForm.form.markAsPristine();
  }

  private save(): void {
    if (!this.tagsetModel) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
      return;
    }

    let msgSuccess = "Operazione effettuata con successo";
    let apiCall;

    if (this.isEditing) {
      msgSuccess = "Tagset modificato con successo";
      apiCall = this.tagsetService.update(this.tagsetModel);
    }
    else {
      msgSuccess = "Tagset creato con successo";
      apiCall = this.tagsetService.create(this.tagsetModel);
    }

    this.loaderService.show();
    apiCall.subscribe({
      next: () => {
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(msgSuccess));
      },
      error: (err: string) => {
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
      }
    });
  }

  private saveTagsetValue(): void {
    if (!this.tagsetValueModel) {
      return;
    }

    if (this.isTagsetValueEditing) {
      let i = this.tagsetModel.values!.findIndex((item: any) => item.originalName == this.tagsetValueModel.originalName);

      if (!this.tagsetModel.values || i < 0) {
        // messaggio di errore

        $('#tagsetValueModal').modal('hide');
        return;
      }

      this.tagsetValueModel.originalName = this.tagsetValueModel.name;

      this.areTagsetValuesChanged = true;
      this.tagsetModel.values[i] = {...this.tagsetValueModel};
    }
    else {
      let v = this.findTagsetValueByName(this.tagsetValueModel.name || "");

      if (v) {
        // messaggio di errore nome già esistente

        $('#tagsetValueModal').modal('hide');
        return;
      }

      this.tagsetValueModel.originalName = this.tagsetValueModel.name;

      this.areTagsetValuesChanged = true;
      this.tagsetModel.values?.push(JSON.parse(JSON.stringify(this.tagsetValueModel)));
    }

    $('#tagsetValueModal').modal('hide');
  }

  private saveWithFormErrors(): void {
    this.tagsetForm.form.markAllAsTouched();
  }

  private saveTagsetValueWithFormErrors(): void {
    this.tagsetValueForm.form.markAllAsTouched();
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
