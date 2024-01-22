import { HttpErrorResponse } from "@angular/common/http";
import { Component, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MessageService } from "primeng/api";
import { Subject, debounceTime, distinctUntilChanged, filter, take, takeUntil } from "rxjs";
import { PopupDeleteItemComponent } from "src/app/controllers/popup/popup-delete-item/popup-delete-item.component";
import { GENERIC_RELATION_TYPE } from "src/app/models/lexicon/lexicon-updater";
import { LexiconService } from "src/app/services/lexicon.service";
import { MessageConfigurationService } from "src/app/services/message-configuration.service";
import { PropertyItem } from "../lex-entity-semantic-rel-indirect.component";

@Component({
  selector: 'app-lex-entity-indirect-rel-property',
  templateUrl: 'lex-entity-indirect-rel-property.component.html',
  styleUrls: ['./lex-entity-indirect-rel-property.component.scss']
})
export class LexEntityIndirectRelPropertyComponent implements OnInit, OnDestroy {

  @Input() propertyItem!: PropertyItem;
  @Input() onRemovePropertyDelegate?: (propertyItem: PropertyItem) => void;

  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  textFieldUpdate = new Subject<string>();
  private unsubscribe$ = new Subject<void>();
  private isRemoved = false;

  constructor(
    private lexiconService: LexiconService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) { }

  private showHttpError(err: HttpErrorResponse): void {
    console.error(err);
    const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error.message}`);
    this.messageService.add(message);
  }

  ngOnInit() {
    this.textFieldUpdate.pipe(
      takeUntil(this.unsubscribe$),
      filter((value: string) => !this.isRemoved && !!value),
      debounceTime(500),
      distinctUntilChanged())
      .subscribe((value: string) => {
        this.onUpdateProperty(value);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  onUpdateProperty = (newValue: string) => {
    const { indirectRelationshipURI, propertyURI, value } = this.propertyItem;
    this.lexiconService.updateGenericRelation(indirectRelationshipURI, {
      type: GENERIC_RELATION_TYPE.METADATA,
      relation: propertyURI,
      value: newValue,
      currentValue: value,
    }).pipe(take(1)).subscribe({
      next: () => {
        this.propertyItem.value = newValue;
        const message = this.msgConfService.generateSuccessMessageConfig(`${this.propertyItem.menuItem.label} updated`);
        this.messageService.add(message);
      },
      error: this.showHttpError
    });
  }

  onRemoveProperty = () => {
    const confirmMsg = `Are you sure to remove "${this.propertyItem.menuItem.label}"?`;
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirmSimple(() => {

      const { indirectRelationshipURI, value, menuItem } = this.propertyItem;
      this.lexiconService.deleteRelation(indirectRelationshipURI, {
        relation: menuItem.id || '',
        value,
      }).pipe(take(1))
        .subscribe({
          next: () => {
            this.isRemoved = true;
            if (this.onRemovePropertyDelegate) {
              this.onRemovePropertyDelegate(this.propertyItem);
            }
          },
          error: this.showHttpError
        });
    });
  }

}
