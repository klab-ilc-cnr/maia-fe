import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { catchError, take, throwError } from 'rxjs';
import { OntologyAnnotations } from 'src/app/models/ontology/ontology-annotations.model';
import { OntologyData, OntologyDataAnnotations } from 'src/app/models/ontology/ontology-data.model';
import { CommonService } from 'src/app/services/common.service';
import { OntologyService } from 'src/app/services/ontology.service';
import { AnnotationsSectionComponent } from '../../viewers/common/annotations-section/annotations-section.component';

@Component({
  selector: 'app-ontology-data-explorer',
  templateUrl: './ontology-data-explorer.component.html',
  styleUrls: ['./ontology-data-explorer.component.scss']
})
export class OntologyDataExplorerComponent implements OnInit {

  @Input()
  public panelHeight!: number;

  @ViewChild(AnnotationsSectionComponent) public annotationSection: AnnotationsSectionComponent | undefined;

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
      this.annotations = [...this.annotations, ...this.annotations]; //TODO ELIMINARE
      this.annotationSection?.refreshScrollPanel();
    });
  }

  ngAfterViewInit(): void {
    if (this.annotationSection) {
      this.annotationSection.refreshScrollPanel();
    }
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
        prefix: '', //TODO: get prefix
        shortId: annotation.shortId,
        target: annotation.label[0].value, //FIXME: quale valore dell'array prendere?
        language: annotation.label[0].language //FIXME: quale valore dell'array prendere?
      }
    });
  }

  /**
   * Refresh the height of the annotation section
   */
  refreshAnnotationHeigh() {
    this.annotationSection?.refreshScrollPanel();
  }
}
