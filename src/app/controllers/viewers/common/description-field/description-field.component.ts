import { Component, Input, OnInit } from '@angular/core';
import { OntologyDescriptionField } from 'src/app/models/ontology/ontology-description-field.model';

@Component({
  selector: 'app-description-field',
  templateUrl: './description-field.component.html',
  styleUrls: ['./description-field.component.scss']
})
export class DescriptionFieldComponent implements OnInit {
  @Input()
  public descriptions!: Array<OntologyDescriptionField>
  constructor() { }

  ngOnInit(): void {
  }

}
