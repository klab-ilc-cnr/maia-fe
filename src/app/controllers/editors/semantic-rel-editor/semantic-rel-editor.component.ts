import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, take } from 'rxjs';
import { SenseCore  } from 'src/app/models/lexicon/lexical-entry.model';
import { UserService } from 'src/app/services/user.service';
import { MenuItem, MessageService } from 'primeng/api';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { FormGroup } from '@angular/forms';
import { SenseRelationTypeModel } from 'src/app/models/lexicon/sense-relation-type.model';
import { LinguisticRelationModel } from 'src/app/models/lexicon/linguistic-relation.model';
import { LexicalSenseResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';


export interface FormItem {
  relationshipLabel: string,
  relationshipURI: string,
  destinationLabel: string,
  destinationURI: string,
  itemID: number,
}

@Component({
  selector: 'app-semantic-rel-editor',
  templateUrl: './semantic-rel-editor.component.html',
  styleUrls: ['./semantic-rel-editor.component.scss']
})
export class SemanticRelEditorComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  @Input() senseEntry!: SenseCore;

  /**Identificativo dell'entrata lessicale di appartenenza */
  @Input() lexEntryId!: string;

  formItems: FormItem[] = [];

  /**Elementi del menu relativi alle definizioni */
  menuItems: MenuItem[] = [];
  /**Form per la modifica dei valori del senso */
  form = new FormGroup({
    directSenseRelations: new FormGroup({}),
  });

  uniqueID = 0;

  constructor(
    private userService: UserService,
    private lexiconService: LexiconService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) {  }


  private sortMenuItems(a: MenuItem, b: MenuItem): number {
    return (a.label || '') > (b.label || '')? 1 : -1;
  }

  private menuItemByRelationshipId :{ [id: string] : MenuItem } = {};

  private buildMenuItems(relationTypes: SenseRelationTypeModel[]): MenuItem[] {

    const rootNode : MenuItem = {label: '', command: (e) => { console.error(e) }, items: []};

    // Prepare nodes
    const nodeById = this.menuItemByRelationshipId;

    for (const relationType of relationTypes) {
      const { propertyLabel, propertyId, propertyDescription } = relationType;
      nodeById[propertyId] = {
        label: propertyLabel,
        command: () => { this.onAddRelationship(propertyLabel, propertyId) },
        tooltip: propertyDescription,
      };
    }

    // Prepare sub-items per each node

    for (const relationType of relationTypes) {
      let parentNode = nodeById[relationType.parentID] || rootNode;
      const childNode = nodeById[relationType.propertyId];
      if (parentNode == childNode) parentNode = rootNode;
      parentNode.items = (parentNode.items || []);
      parentNode.items.push(childNode);
    }

    // Sort alphabetically

    for (const relationType of relationTypes) {
      const node = nodeById[relationType.propertyId];
      if (!node.items) continue;
      node.items.sort(this.sortMenuItems);
    }

    rootNode.items?.sort(this.sortMenuItems);

    return rootNode.items || [];
  }

  private populateRelationships(items: LinguisticRelationModel[]): void {
    for (const [itemID, item] of items.entries()) {
      const {link, entity, label} = item;
      if (!link) continue;
      const newItem : FormItem = {
        relationshipLabel: this.menuItemByRelationshipId[link].label || '',
        relationshipURI: link,
        destinationURI: entity || '',
        destinationLabel: label || '',
        itemID
      };

      this.formItems.unshift(newItem);
      this.uniqueID = this.formItems.length;
    }
  }

  ngOnInit(): void {
    this.lexiconService.getSenseRelationTypes().pipe(
      take(1),
    ).subscribe(relationTypes => {
      this.menuItems = this.buildMenuItems(relationTypes);
    });

    this.lexiconService.getLexicalSenseRelations(this.senseEntry.sense).pipe(
      take(1),
    ).subscribe((results: LexicalSenseResponseModel) => {
      this.populateRelationships(results.directRelations);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  onAddRelationship(relationshipLabel: string, relationshipURI: string) {
    const newItem : FormItem = {
      itemID: this.uniqueID++,
      relationshipLabel,
      relationshipURI,
      destinationURI: '',
      destinationLabel: '',
    };
    this.formItems.unshift(newItem);
  }

}
