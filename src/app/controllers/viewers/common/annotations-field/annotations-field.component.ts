import { Component, Input, OnInit } from '@angular/core';
import { OntologyAnnotationsField } from 'src/app/models/ontology/ontology-annotations-field.model';

@Component({
  selector: 'app-annotations-field',
  templateUrl: './annotations-field.component.html',
  styleUrls: ['./annotations-field.component.scss']
})
export class AnnotationsFieldComponent implements OnInit {
  @Input()
  public annotations!: Array<OntologyAnnotationsField>

  constructor() { }

  ngOnInit(): void {
  }

}
