import { Component, Input, OnInit } from '@angular/core';
import { OntologyClassDescription } from 'src/app/models/ontology/ontology-class-description.model';
import { TileType } from 'src/app/models/tile/tile-type.model';

@Component({
  selector: 'app-description-section',
  templateUrl: './description-section.component.html',
  styleUrls: ['./description-section.component.scss']
})
//TODO CLASSE DA ELIMINARE
export class DescriptionSectionComponent implements OnInit {
  @Input()
  public descriptions!: OntologyClassDescription

  @Input()
  public ontologyObjectType!: TileType;

  constructor() { }

  ngOnInit(): void {
  }

  public displayIcon() {
    switch (this.ontologyObjectType) {
      case TileType.ONTOLOGY_CLASS_VIEWER:
        return 'ontology-dot';
      case TileType.ONTOLOGY_OBJECT_PROPERTY_VIEWER:
        return 'ontology-object-rectangle';
      case TileType.ONTOLOGY_DATA_PROPERTY_VIEWER:
        return 'ontology-data-rectangle';
      case TileType.ONTOLOGY_INDIVIDUAL_VIEWER:
        return 'ontology-individual-rhombus';
      default:
        console.error("ontology type" + this.ontologyObjectType + " is not valid");
        return '';
    }
  }

}
