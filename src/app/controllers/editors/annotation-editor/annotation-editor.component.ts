import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Annotation } from 'src/app/model/annotation/annotation';
import { LayerWithFeatures } from 'src/app/model/layer-with-features';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LayerService } from 'src/app/services/layer.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { WorkspaceService } from 'src/app/services/workspace.service';

@Component({
  selector: 'app-annotation-editor',
  templateUrl: './annotation-editor.component.html',
  styleUrls: ['./annotation-editor.component.scss']
})
export class AnnotationEditorComponent implements OnInit {

  @Input() annotationModel: Annotation | undefined;
  @Input() fileId: number | undefined;
  @Input() selection: any;

  @ViewChild(NgForm) public annotationForm!: NgForm;

  constructor(
    private annotationService: AnnotationService,
    private workspaceService: WorkspaceService,
    private layerService: LayerService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  ngOnInit(): void {
    // if (!this.layerId) {
    //   return;
    // }

    // console.log(this.layerId)

    // this.layerService.retrieveLayerById(this.layerId)
    //   .subscribe((data: LayerWithFeatures) => {

    //   });
  }

  onSubmit(form: NgForm): void {
    if (this.annotationForm.invalid) {
      return this.saveWithFormErrors();
    }

    this.save();
  }


  private save(): void {
    if (!this.fileId) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"))
      return;
    }

    // this.loaderService.show();
    this.annotationService
        .create(this.fileId, this.annotationForm.form.value)
        .subscribe({
          next: () => {
            // this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig("Annotazione createa con successo"));
          },
          error: (err: string) => {
            //this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(err))
          }
        });
  }

  private saveWithFormErrors(): void {
    this.annotationForm.form.markAllAsTouched();
    //this.alertService.error(this.translations['common.messages.errors.savingFailed']);
  }
}
