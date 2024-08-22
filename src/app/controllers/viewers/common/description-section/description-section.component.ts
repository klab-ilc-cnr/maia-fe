import { Component, Input, OnInit } from '@angular/core';
import { OntologyDescription } from 'src/app/models/ontology/ontology-description.model';

@Component({
  selector: 'app-description-section',
  templateUrl: './description-section.component.html',
  styleUrls: ['./description-section.component.scss']
})
export class DescriptionSectionComponent implements OnInit {
  @Input()
  public descriptions!: OntologyDescription
  constructor() { }

  ngOnInit(): void {
  }

}
