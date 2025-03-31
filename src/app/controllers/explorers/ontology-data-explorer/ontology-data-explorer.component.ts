import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { catchError, take, throwError } from 'rxjs';
import { OntologyAnnotations } from 'src/app/models/ontology/ontology-annotations.model';
import { OntologyData, OntologyDataAnnotations } from 'src/app/models/ontology/ontology-data.model';
import { CommonService } from 'src/app/services/common.service';
import { OntologyService } from 'src/app/services/ontology.service';
import { AnnotationsSectionComponent } from '../../viewers/common/annotations-section/annotations-section.component';
import { ScrollPanel } from 'primeng/scrollpanel';

@Component({
  selector: 'app-ontology-data-explorer',
  templateUrl: './ontology-data-explorer.component.html',
  styleUrls: ['./ontology-data-explorer.component.scss']
})
export class OntologyDataExplorerComponent implements OnInit, AfterViewInit {

  @Input()
  public panelHeight!: number;

  @ViewChild(AnnotationsSectionComponent) public annotationSection: AnnotationsSectionComponent | undefined;
  @ViewChild('scrollPanelDirectImports') public scrollPanelDirect!: ScrollPanel;
  @ViewChild('scrollPanelIndirectImports') public scrollPanelIndirect!: ScrollPanel;

  public ontologyData!: OntologyData;
  public annotations!: Array<OntologyAnnotations>;

  constructor(private commonService: CommonService, private ontologyService: OntologyService) { }

  ngOnInit(): void {
    this.ontologyService.getOntologyData().pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.commonService.throwHttpErrorAndMessage(error, error.error.detail);
        return throwError(() => new Error(error.error));
      }),
    ).subscribe((data) => {
      this.ontologyData = data;
      this.annotations = this.adaptAnnotation(this.ontologyData.annotations);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => { //FIX scrollpanel no scroller issue
      if (this.annotationSection?.scrollPanel) {
        this.annotationSection?.scrollPanel.refresh();
      }
    });
  }

  /**
   * Adapt the annotation data
   * @param annotations {OntologyDataAnnotations[]} Annotations
   * @returns {OntologyAnnotations[]} Adapted annotations
   */
  private adaptAnnotation(annotations: OntologyDataAnnotations[]): OntologyAnnotations[] {
    return annotations.map((annotation: OntologyDataAnnotations) => {
      return {
        id: annotation.id,
        prefix: undefined,
        shortId: annotation.shortId,
        target: annotation.label.length > 0 ? annotation.label[0].value : '', // Check if label is not empty
        language: annotation.label.length > 0 ? annotation.label[0].language : '' // Check if label is not empty
      }
    });
  }

  /**
   * Refresh the scroll panels
  */
  refreshScrollPanels() {
    if (this.annotationSection) {
      this.annotationSection.refreshScrollPanel();
    }

    this.scrollPanelDirect.cd.detectChanges();
    this.scrollPanelDirect.calculateContainerHeight();

    this.scrollPanelIndirect.cd.detectChanges();
    this.scrollPanelIndirect.calculateContainerHeight();
  }
}
