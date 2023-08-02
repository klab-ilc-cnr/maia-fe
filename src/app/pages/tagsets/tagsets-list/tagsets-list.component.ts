import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { TTagset } from 'src/app/models/texto/t-tagset';
import { TagsetStateService } from 'src/app/services/tagset-state.service';
import { nameDuplicateValidator } from 'src/app/validators/not-duplicate-name.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

/**Componente della lista dei tagset */
@Component({
  selector: 'app-tagsets-list',
  templateUrl: './tagsets-list.component.html',
  styleUrls: ['./tagsets-list.component.scss'],
  providers: [TagsetStateService]
})
export class TagsetsListComponent implements OnDestroy {
  private readonly unsubscribe$ = new Subject();
  visibleEditNewTagset = false;
  modalTitle = '';
  tagsets$ = this.tagsetState.tagsets$;
  tagsetsNames: string[] = [];
  tagsetTotal$ = this.tagsetState.tagsetsTotal$;
  tagsetForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    description: new FormControl<string>(''),
  });
  get name() { return this.tagsetForm.controls.name; }
  get description() { return this.tagsetForm.controls.description; }
  tagsetOnEdit: TTagset | undefined;

  /**
   * Esegue la rimozione di un tagset
   * @param id {number} identificativo numerico del tagset
   */
  private delete = (id: number): void => {
    this.tagsetState.removeTagset.next(id);
  }

  /**Riferimento al popup di cancellazione elemento */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per TagsetsListComponent
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param router {Router} servizi per la navigazione fra le viste
   */
  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private tagsetState: TagsetStateService,
  ) {
    this.tagsets$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(tl => {
      const temp = tl.map(t => t.name!);
      this.tagsetsNames = temp ? temp : [];
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
   * Metodo che visualizza il popup di conferma cancellazione ed eventualmente richiama proprietà di cancellazione
   * @param tagset {TTagset} tagset selezionato
   */
  onDelete(tagset: TTagset): void {
    const confirmMsg = `You are about to delete the tagset "${tagset.name}"`;

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(tagset.id!), tagset.id, tagset.name);
  }

  /**
   * Metodo che esegue la navigazione di un tagset per la sua modifica
   * @param tagset {Tagset} tagset selezionato
   */
  onEdit(tagset: TTagset): void {
    this.tagsetForm.reset();
    this.tagsetOnEdit = tagset;
    this.name.setValue(tagset.name || '');
    this.name.setValidators(nameDuplicateValidator(this.tagsetsNames));
    this.description.setValue(tagset.description || '');
    this.modalTitle = tagset.name || 'Edit tagset';
    this.visibleEditNewTagset = true;
  }

  onEditTagsetItems(tagset: TTagset) {
    this.router.navigate([tagset.id], { relativeTo: this.activeRoute });
  }

  /**Metodo che esegue la navigazione su un "nuovo" tagset */
  onNew(): void {
    this.tagsetOnEdit = undefined;
    this.tagsetForm.reset();
    this.modalTitle = 'New tagset';
    this.name.setValidators(nameDuplicateValidator(this.tagsetsNames));
    this.visibleEditNewTagset = true;
  }

  onSubmitTagsetModal() {
    if (this.tagsetForm.invalid || this.name.value === '') return;
    if (this.tagsetOnEdit !== undefined) {
      const updatedTagset = <TTagset>{ ...this.tagsetOnEdit, name: this.name.value, description: this.description.value };
      this.tagsetState.updateTagset.next(updatedTagset);
    } else {
      const newTagset = <TTagset>{ name: this.name.value, description: this.description.value };
      this.tagsetState.addTagset.next(newTagset);
    }
    this.visibleEditNewTagset = false;
    this.tagsetOnEdit = undefined;
  }
}
