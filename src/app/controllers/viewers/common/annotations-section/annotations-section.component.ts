import { Component, Input, OnInit } from '@angular/core';
import { OntologyAnnotations } from 'src/app/models/ontology/ontology-annotations.model';

@Component({
  selector: 'app-annotations-section',
  templateUrl: './annotations-section.component.html',
  styleUrls: ['./annotations-section.component.scss']
})
export class AnnotationsSectionComponent implements OnInit {
  @Input()
  public annotations!: Array<OntologyAnnotations>

  constructor() { }

  ngOnInit(): void {
  }

}
