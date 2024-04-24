import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, of, switchMap, takeUntil } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { TTagset } from 'src/app/models/texto/t-tagset';
import { TTagsetItem } from 'src/app/models/texto/t-tagset-item';
import { CommonService } from 'src/app/services/common.service';
import { TagsetStateService } from 'src/app/services/tagset-state.service';
import { nameDuplicateValidator } from 'src/app/validators/not-duplicate-name.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';
import Swal from 'sweetalert2';

/**Component for creating/editing a tagset */
@Component({
  selector: 'app-tagset-create-edit',
  templateUrl: './tagset-create-edit.component.html',
  styleUrls: ['./tagset-create-edit.component.scss'],
  providers: [TagsetStateService],
})
export class TagsetCreateEditComponent implements OnInit, OnDestroy {
  /**Subject for subscribe management */
  private readonly unsubscribe$ = new Subject();
  /**Current tagset to be edited */
  ttagset!: TTagset;
  /**Observable of the current tagset */
  ttagset$ = this.tagsetState.tagset$;
  /**Observable of the current tagset name */
  ttagsetName = this.ttagset$.pipe(
    switchMap(t => of(t.name)),
  );
  /**Observabkle of the current tagset description */
  ttagsetDescription = this.ttagset$.pipe(
    switchMap(t => of(t.description)),
  );
  /**Observable of the current tagset items (its values) */
  ttagsetItems$ = this.tagsetState.tagsetItems$;
  /**Title for the new edit modal */
  newEditTitle = '';
  /**Defines whether the creation/insertion modal of a tagset value (or item) is visible */
  visibleEditNewTagsetItem = false;
  /**Tagset item form */
  tagsetItemForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    description: new FormControl<string>(''),
  });
  /**Getter for the form name field */
  get name() { return this.tagsetItemForm.controls.name }
  /**Getter for the form description field */
  get description() { return this.tagsetItemForm.controls.description }
  /**Tagset item to be edited */
  ttagsetItemOnEdit: TTagsetItem | undefined;
  /**List of tagset items names */
  ttagsetItemsName: string[] = [];

  /**
   * @private
   * Performs removal of a tagset value
   * @param tagsetItem {TTagsetItem} tagset item to be removed
   * @returns {void}
   */
  private deleteValue = (tagsetItem: TTagsetItem): void => {
    this.tagsetState.removeTagsetItem.next(tagsetItem);
  }

  /**Getter that returns whether the tagset value is in edit mode */
  public get isTagsetValueEditing(): boolean {
    return this.ttagsetItemOnEdit !== undefined;
  }

  /**Reference to cancellation confirmation popup */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costructor for TagsetCreateEditComponent
   * @param activeRoute {ActivatedRoute} Provides access to information about a route associated with a component that is loaded in an outlet
   * @param router {Router} A service that provides navigation among views and URL manipulation capabilities
   * @param tagsetState {TagsetStateService} service that manages the general state of the tagsets
   * @param commonService {CommonService} services related to shared functionality 
   */
  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private tagsetState: TagsetStateService,
    private commonService: CommonService,
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

  /**OnInit interface method, used to decide whether to return to the list page, load tagset data, or start a new entry */
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

  /**Method of the OnDestroy interface, used to emit the unsubscribe subject */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
    Swal.close();
  }

  /**Method that performs navigation back to tagsets list */
  backToList() {
    this.router.navigate(["../"], { relativeTo: this.activeRoute });
  }

  /**
   * Method that displays the modal confirming the deletion of a tagset value and eventually invokes the deletion property
   * @param value {TTagsetItem} tagset value item
   */
  showDeleteValueModal(value: TTagsetItem): void {
    const valueName: string = value.name ?? '';
    const confirmMsg = this.commonService.translateKey('TAGSET_MANAGER.aboutDeleteTagsetValue').replace('${tagsetValueName}', valueName);
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteValue((value)), value);
  }

  /**
   * Method that displays the modal of editing a tagset value
   * @param value {TTagsetItem} tagset value item
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

  /**Method that displays the modal for entering a new tagset value */
  showTagsetValueModal() {
    this.ttagsetItemOnEdit = undefined;
    this.newEditTitle = this.commonService.translateKey('TAGSET_MANAGER.newTagsetValue');
    this.tagsetItemForm.reset();
    this.name.setValidators(nameDuplicateValidator(this.ttagsetItemsName));
    this.visibleEditNewTagsetItem = true;
  }

  /**
   * Method that submits the form save tagset value
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
