import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { PropertyItem } from "../semantic-rel-indirect.component";
import { PopupDeleteItemComponent } from "src/app/controllers/popup/popup-delete-item/popup-delete-item.component";
import { LexiconService } from "src/app/services/lexicon.service";
import { take } from "rxjs";
import { MessageService } from "primeng/api";
import { MessageConfigurationService } from "src/app/services/message-configuration.service";
import { GENERIC_RELATION_TYPE } from "src/app/models/lexicon/lexicon-updater";

@Component({
  selector: 'app-indirect-rel-property',
  templateUrl: 'indirect-rel-property.component.html',
  styleUrls: ['./indirect-rel-property.component.scss']
})
export class IndirectRelPropertyComponent implements OnInit {

  @Input() propertyItem!: PropertyItem;
  @Input() onRemovePropertyDelegate?: (propertyItem: PropertyItem) => void;

  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  constructor(
    private lexiconService: LexiconService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) {}

  ngOnInit() {
    /*
    this.propertyItem.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(500),
      distinctUntilChanged(),
    ).subscribe((resp: { [key: string]: any }) => {
     */
  }

  onUpdateProperty = ($event: any) => {
    const newValue = $event.target.value;
    const {indirectRelationshipURI, propertyURI, value} = this.propertyItem;
    this.lexiconService.updateGenericRelation(indirectRelationshipURI, {
      type: GENERIC_RELATION_TYPE.METADATA,
      relation: propertyURI,
      value: newValue,
      currentValue: value,
    }).pipe(take(1)).subscribe(
      () => {
        this.propertyItem.value = value;
        const message = this.msgConfService.generateSuccessMessageConfig(`${this.propertyItem.menuItem.label} updated`);
        this.messageService.add(message);
    },
      (err) => {
        console.error(err);
        const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error}`);
        this.messageService.add(message);
      }

    );
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
      .subscribe(
        () => {
          if (this.onRemovePropertyDelegate)
            this.onRemovePropertyDelegate(this.propertyItem);
          },
        (err) => {
          console.error(err);
          const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error}`);
          this.messageService.add(message);
        }
      );
    });
  }

}
