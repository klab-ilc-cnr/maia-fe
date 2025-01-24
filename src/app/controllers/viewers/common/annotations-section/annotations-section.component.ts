import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
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

  @Input()
  public maxSize?: number;

  @ViewChild('scrollPanel') public scrollPanel!: ScrollPanel;
  public scrollPanelMaxSize = window.innerHeight / 4;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    setTimeout(() => { //This fixes the p-scrollpanel bug max-height on dynamic content
      this.scrollPanelMaxSize = this.maxSize ?? window.innerHeight / 4
      this.scrollPanel.cd.detectChanges();
      this.scrollPanel.calculateContainerHeight();
    });
  }

  /**
   * Refresh the scroll panel
   */
  refreshScrollPanel() {
    this.scrollPanel.cd.detectChanges();
    this.scrollPanel.calculateContainerHeight();
  }

}
