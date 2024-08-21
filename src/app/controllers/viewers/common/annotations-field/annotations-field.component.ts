import { Component, Input, OnInit } from '@angular/core';
import { OntologyBaseViewer } from 'src/app/models/ontology/ontology-base-viewer.model';

@Component({
  selector: 'app-annotations-field',
  templateUrl: './annotations-field.component.html',
  styleUrls: ['./annotations-field.component.scss']
})
export class AnnotationsFieldComponent implements OnInit {
  @Input()
  public dataResults!: Array<OntologyBaseViewer>

  constructor() { }

  ngOnInit(): void {
  }

}
