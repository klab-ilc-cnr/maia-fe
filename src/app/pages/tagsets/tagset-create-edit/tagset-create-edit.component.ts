import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NgForm, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of, switchMap, takeUntil } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { TTagset } from 'src/app/models/texto/t-tagset';
import { TTagsetItem } from 'src/app/models/texto/t-tagset-item';
import { TagsetStateService } from 'src/app/services/tagset-state.service';
import { nameDuplicateValidator } from 'src/app/validators/not-duplicate-name.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';
import Swal from 'sweetalert2';

/**Componente per la creazione/modifica di un tagset */
@Component({
  selector: 'app-tagset-create-edit',
  templateUrl: './tagset-create-edit.component.html',
  styleUrls: ['./tagset-create-edit.component.scss'],
  providers: [TagsetStateService],
})
export class TagsetCreateEditComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  ttagset!: TTagset;
  ttagset$ = this.tagsetState.tagset$;
  ttagsetName = this.ttagset$.pipe(
    switchMap(t => of(t.name)),
  );
  ttagsetDescription = this.ttagset$.pipe(
    switchMap(t => of(t.description)),
  );
  ttagsetItems$ = this.tagsetState.tagsetItems$;
  newEditTitle = '';
  visibleEditNewTagsetItem = false;
  tagsetItemForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    description: new FormControl<string>(''),
  });
  get name() { return this.tagsetItemForm.controls.name }
  get description() { return this.tagsetItemForm.controls.description }
  ttagsetItemOnEdit: TTagsetItem | undefined;
  ttagsetItemsName: string[] = [];

  /**
   * @private
   * Effettua la rimozione di un valore del tagset
   * @param tagsetItem {string} nome del valore
   * @returns {void}
   */
  private deleteValue = (tagsetItem: TTagsetItem): void => {
    this.tagsetState.removeTagsetItem.next(tagsetItem);
  }

  /**Getter che restituisce se il valore del tagset è in modalità di modifica */
  public get isTagsetValueEditing(): boolean {
    return this.ttagsetItemOnEdit !== undefined;
  }

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per TagsetCreateEditComponent
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param router {Router} servizi per la navigazione fra le viste
   */
  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private tagsetState: TagsetStateService,
  ) {
    this.tagsetState.tagset$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(tagset => {
      this.ttagset = tagset;
    });
    this.ttagsetItems$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(ti => {
      const temp = ti.map(t => t.name!);
      this.ttagsetItemsName = temp;
    });
  }

  /**Metodo dell'interfaccia OnInit, utilizzato per decidere se tornare alla pagina della lista, caricare i dati del tagset o iniziare un nuovo inserimento */
  ngOnInit(): void {
    this.activeRoute.paramMap.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((params) => {
      const id = params.get('id');
      if (id == null) {
        this.backToList();
        return;
      }
      this.tagsetState.retrieveTagset.next(+id);
      this.tagsetState.retrieveTagsetItems.next(+id);
    });

  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per chiudere eventuali popup swal */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
    Swal.close();
  }

  /**Metodo che esegue la navigazione sulla lista dei tagset */
  backToList() {
    this.router.navigate(["../"], { relativeTo: this.activeRoute });
  }

  /**
   * Metodo che visualizza il modale di conferma della cancellazione di un valore di un tagset ed eventualmente richiama la proprietà di cancellazione
   * @param value {TTagsetItem} valore di un tagset
   */
  showDeleteValueModal(value: TTagsetItem): void {
    const confirmMsg = `You are about to delete the tagset "${value.name}"`;
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteValue((value)), value);
  }

  /**
   * Metodo che visualizza il modale di modifica di un valore di un tagset
   * @param value {TTagsetItem} valore di un tagset
   */
  showEditValueModal(value: TTagsetItem): void {
    this.newEditTitle = value.name!;
    this.ttagsetItemOnEdit = value;
    this.tagsetItemForm.reset();
    this.name.setValue(value.name || '');
    this.name.setValidators(nameDuplicateValidator(this.ttagsetItemsName));
    this.description.setValue(value.description || '');
    this.visibleEditNewTagsetItem = true;
  }

  /**Metodo che visualizza il modale di inserimento di un nuovo valore del tagset */
  showTagsetValueModal() {
    this.newEditTitle = 'New tagset value'
    this.tagsetItemForm.reset();
    this.name.setValidators(nameDuplicateValidator(this.ttagsetItemsName));
    this.visibleEditNewTagsetItem = true;
  }

  /**
   * Metodo che sottomette il salvataggio del form del valore del tagset
   * @param form {NgForm} form del valore del tagset
   * @returns {void}
   */
  onSubmitTagsetValueModal(): void {
    if (this.tagsetItemForm.invalid || this.name.value === '') return;
    if (this.ttagsetItemOnEdit !== undefined) {
      const updatedTagsetItem = <TTagsetItem>{ ...this.ttagsetItemOnEdit, name: this.name.value, description: this.description.value };
      this.tagsetState.updateTagsetItem.next(updatedTagsetItem);
    } else {
      const newTagsetItem = <TTagsetItem>{ name: this.name.value, description: this.description.value, tagset: this.ttagset };
      this.tagsetState.addTagsetItem.next(newTagsetItem);
    }
    this.visibleEditNewTagsetItem = false;
    this.ttagsetItemOnEdit = undefined;
  }
}
