import { LoaderService } from 'src/app/services/loader.service';
import { TagsetService } from 'src/app/services/tagset.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { MessageService, SelectItem } from 'primeng/api';
import { LayerService } from 'src/app/services/layer.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Layer } from 'src/app/models/layer/layer.model';
import { Feature } from 'src/app/models/feature/feature';
import { NgForm } from '@angular/forms';
import { FeatureType } from 'src/app/models/feature/feature-type';
import { Tagset } from 'src/app/models/tagset/tagset';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';

declare var $: any;

@Component({
  selector: 'app-layers-view',
  templateUrl: './layers-view.component.html',
  styleUrls: ['./layers-view.component.scss']
})
export class LayersViewComponent implements OnInit {
  private deleteFeature = (id: number, name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare la feature tagset \'' + name + '\'';
    let successMsg = 'Feature \'' + name + '\' eliminato con successo';

    this.layerService
        .deleteFeature(id)
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

  public get featureModalTitle(): string {
    if (((!this.featureForm) || (!this.featureForm.value)) || (!this.featureForm.value.name)) {
      return "Nuova feature";
    }

    return this.featureForm.value.name;
  }

  public get featureType(): boolean {
    return this.featureModel.type == FeatureType.Tagset;
  }

  public get isEditing(): boolean {
    if (this.featureModel && this.featureModel.id) {
      return true;
    }

    return false;
  }

  public get title(): string {
    if (((!this.layerInfo) || (!this.layerInfo.name))) {
      return "Layer";
    }

    return this.layerInfo.name;
  }

  layerInfo: Layer | undefined;
  features: Feature[] = [];
  featureModel: Feature = new Feature();
  featureTypeOptions = new Array<SelectItem>();
  tagsetOptions = new Array<SelectItem>();

  @ViewChild(NgForm) public featureForm!: NgForm;
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  constructor(
    private loaderService: LoaderService,
    private layerService: LayerService,
    private tagsetService: TagsetService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      var id = params.get('id');

      if (id != null) {
        this.loadDetails(Number.parseInt(id));
      }
      else {
        this.back();
      }
    });
  }

  ngOnDestroy(): void {
    Swal.close();
  }

  back() {
    this.router.navigate(['layers']);
  }

  featureTypeChange(event: any) {
    console.log(event, this.featureForm)
    if (!this.featureType) {
      this.featureModel.tagsetId = undefined;
    }
  }

  onSubmitFeatureModal(form: NgForm): void {
    console.log('feature', this.featureForm)
    if (this.featureForm.invalid) {
      return this.saveWithFormErrors();
    }

    this.save();
  }

  showFeatureModal() {
    this.resetForm();
    this.featureModel.layerId = this.layerInfo?.id;

    $('#featureModal').modal('show');
  }

  showDeleteFeatureModal(feature: Feature) {
    let confirmMsg = 'Stai per cancellare la feature \'' + feature.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteFeature(feature.id!, (feature.name || "")), feature.id, (feature.name || ""));
  }

  showEditFeatureModal(feature: Feature) {
    this.resetForm();
    this.featureModel = JSON.parse(JSON.stringify(feature));

    $('#featureModal').modal('show');
  }

  private loadDetails(layerId: number) {
    this.loaderService.show();
    // ATTENZIONE: QUI CI VUOLE LA RETRIEVE SINGOLA BY ID
    this.layerService
      .retrieveLayers()
      .subscribe({
        next: (layers: Layer[]) => {
          this.layerInfo = layers.find(l => l.id == layerId);
          this.loaderService.hide();
        }
      });

    this.loaderService.show();
    this.layerService
      .retrieveFeaturesByLayerId(layerId)
      .subscribe({
        next: (features: Feature[]) => {
          this.features = features;
          this.loaderService.hide();
        }
      });

    this.loaderService.show();
    this.layerService
      .retrieveFeatureTypes()
      .subscribe({
        next: (data) => {
          this.featureTypeOptions = data.map((item: any) => ({ label: item.name, value: item.name }));
          this.loaderService.hide();
        }
      });

    this.loaderService.show();
    this.tagsetService
      .retrieve()
      .subscribe({
        next: (data: Tagset[]) => {
          this.tagsetOptions = data.map(item => ({ label: item.name, value: item.id }));
          this.loaderService.hide();
        },
        error: (err) => {
          this.loaderService.hide();
          this.messageService.add(this.msgConfService.generateErrorMessageConfig(err))
        }
      });
  }

  private resetForm() {
    this.featureModel = new Feature();
    this.featureForm.form.markAsUntouched();
    this.featureForm.form.markAsPristine();
  }

  private save(): void {
    if (!this.layerInfo || (!this.layerInfo.id) || !this.featureModel) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
      return;
    }

    let msgSuccess = "Operazione effettuata con successo";
    let apiCall;

    if (this.isEditing) {
      msgSuccess = "Feature modificata con successo";
      apiCall = this.layerService.updateFeature(this.featureModel);
    }
    else {
      msgSuccess = "Feature creata con successo";
      apiCall = this.layerService.createFeature(this.featureModel);
    }

    this.loaderService.show();
    apiCall.subscribe({
      next: () => {
        $('#featureModal').modal('hide');
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(msgSuccess));
      },
      error: (err: string) => {
        $('#featureModal').modal('hide');
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
      }
    });
  }

  private saveWithFormErrors(): void {
    this.featureForm.form.markAllAsTouched();
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
