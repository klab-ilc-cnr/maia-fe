import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Annotation } from 'src/app/models/annotation/annotation';
import { Layer } from 'src/app/models/layer/layer.model';
import { Relation } from 'src/app/models/relation/relation';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LayerService } from 'src/app/services/layer.service';
import { LoaderService } from 'src/app/services/loader.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { WorkspaceService } from 'src/app/services/workspace.service';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';
import { RelationService } from 'src/app/services/relation.service';

/**Classe dell'editor delle relazioni */
@Component({
  selector: 'app-relation-editor',
  templateUrl: './relation-editor.component.html',
  styleUrls: ['./relation-editor.component.scss']
})
export class RelationEditorComponent implements OnInit {

  /**
   * @private
   * Effettua la cancellazione di una relazione
   * @param id {number} identificativo numerico della relazione
   * @returns {void}
   */
  private deleteElement = (id: number): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare la relazione'
    let successMsg = 'Relazione eliminata con successo'

    if (id == undefined || id == null || !this.targetAnn.attributes) {
      this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
      return;
    }

    /*     let sIndex = this.sourceAnn.attributes['relations'].out.findIndex((r: Relation) => r.id == this.relationModel?.id);
        let tIndex = this.targetAnn.attributes['relations'].in.findIndex((r: Relation) => r.id == this.relationModel?.id);
    
        if (sIndex < 0) {
          this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
          return;
        }
    
        if (tIndex < 0) {
          this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
          return;
        }
    
        this.sourceAnn.attributes['relations'].out.splice(sIndex, 1);
        this.targetAnn.attributes['relations'].in.splice(tIndex, 1);
    
        this.loaderService.show();
        this.annotationService.update(this.sourceAnn).subscribe({
          next: () => {
            this.annotationService.update(this.targetAnn).subscribe({
              next: () => {
                this.loaderService.hide();
                this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
                Swal.close();
                this.onDelete.emit();
              },
              error: (err: string) => {
                this.loaderService.hide();
                this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
              }
            });
          },
          error: (err: string) => {
            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
          }
        }); */

    this.loaderService.show();
    this.relationService.delete(this.relationModel.id!).subscribe({
      next: () => {
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
        Swal.close();
        this.onDelete.emit();
      },
      error: (err: string) => {
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
      }
    });
  }

  /**Relazione in lavorazione */
  @Input() relationModel: Relation = new Relation();
  /**Layer sorgente */
  @Input() sourceLayer: Layer | undefined;
  /**Layer target */
  @Input() targetLayer: Layer | undefined;

  /**Annotazione sorgente */
  @Input()
  /**Getter dell'annotazione sorgente */
  get sourceAnn(): Annotation { return this._sourceAnn; }
  /**Setter dell'annotazione sorgente */
  set sourceAnn(sourceAnn: Annotation) {
    this._sourceAnn = sourceAnn;
  }
  /**Annotazione sorgente */
  private _sourceAnn: Annotation = new Annotation();

  /**Annotazione target */
  @Input()
  /**Getter dell'annotazione target */
  get targetAnn(): Annotation { return this._targetAnn; }
  /**Setter dell'annotazione target */
  set targetAnn(targetAnn: Annotation) {
    this._targetAnn = targetAnn;
  }
  /**Annotazione target */
  private _targetAnn: Annotation = new Annotation();

  /**Emettitore per l'annullamento */
  @Output() onCancel = new EventEmitter<any>();
  /**Emettitore per la cancellazione */
  @Output() onDelete = new EventEmitter<any>();
  /**Emettitore per il salvataggio */
  @Output() onSave = new EventEmitter<any>();

  /**Getter che definisce se siamo in modalità di modifica */
  public get isEditing(): boolean {
    if (this.relationModel && this.relationModel.id) {
      return true;
    }

    return false;
  }

  /**Getter che definisce se non vi sono relazioni selezionate */
  public get noneRelationIsSelected(): boolean {
    return (!this.relationModel || !this.sourceAnn || !this.sourceLayer || !this.targetAnn || !this.targetLayer);
  }

  /**Lista dei layer */
  layersList: Layer[] = [];

  /**Riferimento al form della relazione */
  @ViewChild(NgForm) public relationForm!: NgForm;
  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per RelationEditorComponent
   * @param annotationService {AnnotationService} servizi relativi alle annotazioni //TODO verificare cancellazione per mancato uso
   * @param workspaceService {WorkspaceService} servizi relativi ai workspace  //TODO verificare cancellazione per mancato uso
   * @param loaderService {LoaderService} servizi per la gestione del segnale di caricamento
   * @param layerService {LayerService} servizi relativi ai layer  //TODO verificare cancellazione per mancato uso 
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param msgConfService {MessageConfigurationService} servizi per la configurazione dei messaggi per messageService
   * @param relationService {RelationService} servizi relativi alle relazioni
   */
  constructor(
    private annotationService: AnnotationService, //TODO verificare cancellazione per mancato uso
    private workspaceService: WorkspaceService, //TODO verificare cancellazione per mancato uso
    private loaderService: LoaderService,
    private layerService: LayerService, //TODO verificare cancellazione per mancato uso
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private relationService: RelationService
  ) { }

  /**Metodo dell'interfaccia OnInit */ //TODO verificare cancellazione per mancato uso
  ngOnInit(): void {
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per chiudere eventuali popup swal */
  ngOnDestroy(): void {
    Swal.close();
  }

  /**Metodo che esegue l'emissione dell'evento di annullamento */
  onCancelBtn() {
    this.onCancel.emit();
  }

  /**Metodo che resetta il form */
  onClearBtn() {
    this.relationForm.form.reset();
    this.saveWithFormErrors();
  }

  /**
   * Metodo che sottomette il salvataggio del form che rappresenta la relazione
   * @param form {NgForm} form della relazione
   * @returns {void}
   */
  onSubmit(form: NgForm): void {
    if (this.relationForm.invalid) {
      return this.saveWithFormErrors();
    }

    this.save();
  }

  /**
   * Metodo che visualizza il modale di conferma della cancellazione ed eventualmente richiama la cancellazione stessa
   * @returns {void}
   */
  showDeleteModal(): void {
    if (!this.relationModel) {
      return;
    }

    let confirmMsg = 'Stai per cancellare una relazione';

    this.popupDeleteItem.confirmMessage = confirmMsg;

    this.popupDeleteItem.showDeleteConfirm(() => this.deleteElement((this.relationModel.id!)), this.relationModel.id);
  }

  /**
   * @private
   * Metodo che esegue il salvataggio della relazione
   * @returns {void}
   */
  private save(): void {
    if (!this.relationModel) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
      return;
    }

    let successMsg = "Operazione effettuata con successo";

    // INIZIO INIZIALIZZAZIONE
    /*     if (!this.sourceAnn.attributes) {
          this.sourceAnn.attributes = {};
        }
    
        if (!this.targetAnn.attributes) {
          this.targetAnn.attributes = {};
        }
    
        if (!this.sourceAnn.attributes['relations']) {
          this.sourceAnn.attributes['relations'] = new Relations();
        }
    
        if (!this.targetAnn.attributes['relations']) {
          this.targetAnn.attributes['relations'] = new Relations();
        }
        // FINE INIZIALIZZAZIONE
    
        if (this.isEditing) {
          successMsg = "Relazione modificata con successo";
    
          let sIndex = this.sourceAnn.attributes['relations'].out.findIndex((r: Relation) => r.id == this.relationModel?.id);
          let tIndex = this.targetAnn.attributes['relations'].in.findIndex((r: Relation) => r.id == this.relationModel?.id);
    
          if (sIndex < 0) {
            return;
          }
    
          if (tIndex < 0) {
            return;
          }
    
          this.sourceAnn.attributes['relations'].out.splice(sIndex, 1);
          this.targetAnn.attributes['relations'].in.splice(tIndex, 1);
        }
        else {
          successMsg = "Relazione creata con successo";
          this.relationModel.id = uuidv4();
        }
    
        this.sourceAnn.attributes['relations'].out.push(JSON.parse(JSON.stringify(this.relationModel)));
        this.targetAnn.attributes['relations'].in.push(JSON.parse(JSON.stringify(this.relationModel)));
    
        // @TODO: queste chiamate andranno sostituite con una unica al nostro backend che gestirà la creazione delle relazioni
        this.loaderService.show();
         this.annotationService.update(this.sourceAnn).subscribe({
          next: () => {
            this.annotationService.update(this.targetAnn).subscribe({
              next: () => {
                this.loaderService.hide();
                this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
                this.onSave.emit();
              },
              error: (err: string) => {
                this.loaderService.hide();
                this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
              }
            });
          },
          error: (err: string) => {
            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
          }
        }); */
    this.sourceAnn.attributes[""]
    if (this.isEditing) { //caso di modifica di una relazione esistente
      successMsg = "Relazione modificata con successo";
      this.relationService.update(this.relationModel).subscribe({
        next: (response: Relation) => {
          console.log(response);
          this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
          this.onSave.emit();
        },
        error: (err: string) => {
          console.log(err);
          this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
        }
      })
    }
    else { //caso inserimento di una nuova relazione
      successMsg = "Relazione creata con successo";
      this.relationService.create(this.relationModel).subscribe({
        next: (response: Relation) => {
          console.log(response);
          this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
          this.onSave.emit();
        },
        error: (err: string) => {
          console.log(err);
          this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
        }
      })
    }
  }

  /**
   * @private
   * Metodo che marca tutti i campi del form come touched per segnalare errori
   */
  private saveWithFormErrors(): void {
    this.relationForm.form.markAllAsTouched();
  }

  /**
   * @private
   * Metodo che visualizza il popup di operazione fallita
   * @param errorMessage {string} messaggio di errore
   */
  private showOperationFailed(errorMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: errorMessage,
      showConfirmButton: true
    });
  }

  /**
   * @private
   * Metodo che visualizza il popup di operazione in corso
   * @param message {string} messaggio da visualizzare
   */
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
