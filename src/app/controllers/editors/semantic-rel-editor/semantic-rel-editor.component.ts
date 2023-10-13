import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, take } from 'rxjs';
import { SenseCore  } from 'src/app/models/lexicon/lexical-entry.model';
import { MenuItem } from 'primeng/api';
import { LexiconService } from 'src/app/services/lexicon.service';
import { SenseRelationTypeModel } from 'src/app/models/lexicon/sense-relation-type.model';
import { LinguisticRelationModel } from 'src/app/models/lexicon/linguistic-relation.model';
import { IndirectRelationModel, LexicalSenseResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';

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

  /**Elementi del menu relativi alle definizioni */
  menuItems: MenuItem[] = [];

  directRelations: LinguisticRelationModel[] = [];
  indirectRelations: IndirectRelationModel[] = [];

  constructor(
    private lexiconService: LexiconService,
  ) {}

  private sortMenuItems(a: MenuItem, b: MenuItem): number {
    return (a.label || '') > (b.label || '')? 1 : -1;
  }

  private menuItemByRelationshipURI :{ [id: string] : MenuItem } = {};

  private buildMenuItems(relationTypes: SenseRelationTypeModel[]): MenuItem[] {

    const rootNode : MenuItem = {label: '', command: (e) => { console.error(e) }, items: []};

    // Prepare nodes
    const nodeById = this.menuItemByRelationshipURI;

    for (const relationType of relationTypes) {
      const { propertyLabel, propertyId, propertyDescription } = relationType;
      nodeById[propertyId] = {
        label: propertyLabel,
        tooltip: propertyDescription,
        id: propertyId,
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

  ngOnInit(): void {
    this.lexiconService.getSenseRelationTypes().pipe(
      take(1),
    ).subscribe(relationTypes => {
      this.menuItems = this.buildMenuItems(relationTypes);
    });

    this.lexiconService.getLexicalSenseRelations(this.senseEntry.sense).pipe(
      take(1),
    ).subscribe((results: LexicalSenseResponseModel) => {
      this.directRelations = results.directRelations;
      this.indirectRelations = results.indirectRelations;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

}
