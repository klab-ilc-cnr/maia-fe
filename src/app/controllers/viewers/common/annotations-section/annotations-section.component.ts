import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { ScrollPanel } from 'primeng/scrollpanel';
import { OntologyAnnotations } from 'src/app/models/ontology/ontology-annotations.model';

@Component({
  selector: 'app-annotations-section',
  templateUrl: './annotations-section.component.html',
  styleUrls: ['./annotations-section.component.scss']
})
export class AnnotationsSectionComponent implements OnInit {
  @Input()
  public annotations!: Array<OntologyAnnotations>

  @ViewChild('scrollPanel') public scrollPanel!: ScrollPanel;

  public scrollPanelMaxSize = window.innerHeight / 4;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    setTimeout(() => { //This fixes the p-scrollpanel bug max-height on dynamic content 
      this.scrollPanel.calculateContainerHeight();
    });
  }

}
