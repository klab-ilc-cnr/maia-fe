import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { TTagset } from 'src/app/models/texto/t-tagset';
import { CommonService } from 'src/app/services/common.service';
import { TagsetStateService } from 'src/app/services/tagset-state.service';
import { nameDuplicateValidator } from 'src/app/validators/not-duplicate-name.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

/**Tagset list component */
@Component({
  selector: 'app-tagsets-list',
  templateUrl: './tagsets-list.component.html',
  styleUrls: ['./tagsets-list.component.scss'],
  providers: [TagsetStateService]
})
export class TagsetsListComponent implements OnDestroy {
  /**Subject for subscribe management */
  private readonly unsubscribe$ = new Subject();
  /**Defines whether the creation/insertion modal of a tagset is visible */
  visibleEditNewTagset = false;
  /**Title for the creation/insertion modal */
  modalTitle = '';
  /**Observable of the tagsets list */
  tagsets$ = this.tagsetState.tagsets$;
  /**List of existing tagsets names */
  tagsetsNames: string[] = [];
  /**Observable of the total number of tagsets */
  tagsetTotal$ = this.tagsetState.tagsetsTotal$;
  /**Tagset description form */
  tagsetForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    description: new FormControl<string>(''),
  });
  /**Getter for the form name field */
  get name() { return this.tagsetForm.controls.name; }
  /**Getter for the form description field */
  get description() { return this.tagsetForm.controls.description; }
  /**Current tagset to be edited */
  tagsetOnEdit: TTagset | undefined;

  /**
   * Performs removal of a tagset
   * @param id {number} tagset numeric identifier
   */
  private delete = (id: number): void => {
    this.tagsetState.removeTagset.next(id);
  }

  /**Reference to item deletion popup */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costructor for TagsetsListComponent
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
    this.tagsets$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(tl => {
      const temp = tl.map(t => t.name!);
      this.tagsetsNames = temp ? temp : [];
    });
  }

  /**Method of the OnDestroy interface, used to emit the unsubscribe subject */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
   * Method that displays the delete confirmation popup and possibly invokes delete properties
   * @param tagset {TTagset} selected tagset
   */
  onDelete(tagset: TTagset): void {
    const tagsetName = tagset.name ?? '';
    const confirmMsg = this.commonService.translateKey('TAGSET_MANAGER.aboutDeleteTagset').replace('${tagsetName}', tagsetName);

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(tagset.id!), tagset.id, tagset.name);
  }

  /**
   * Method that browses a tagset for its modification
   * @param tagset {TTagset} selected tagset
   */
  onEdit(tagset: TTagset): void {
    this.tagsetForm.reset();
    this.tagsetOnEdit = tagset;
    this.name.setValue(tagset.name || '');
    this.name.setValidators(nameDuplicateValidator(this.tagsetsNames));
    this.description.setValue(tagset.description || '');
    this.modalTitle = tagset.name || this.commonService.translateKey('TAGSET_MANAGER.editTagset');
    this.visibleEditNewTagset = true;
  }

  /**
   * Method that performs navigation on the detail of a tagset to edit its items
   * @param tagset {TTagset} selected tagset
   */
  onEditTagsetItems(tagset: TTagset) {
    this.router.navigate([tagset.id], { relativeTo: this.activeRoute });
  }

  /**Method that performs navigation on a "new" tagset */
  onNew(): void {
    this.tagsetOnEdit = undefined;
    this.tagsetForm.reset();
    this.modalTitle = this.commonService.translateKey('TAGSET_MANAGER.newTagset');
    this.name.setValidators(nameDuplicateValidator(this.tagsetsNames));
    this.visibleEditNewTagset = true;
  }

  /**
   * Method that submits form data in the popup for creating or editing a tagset
   * @returns {void}
   */
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
