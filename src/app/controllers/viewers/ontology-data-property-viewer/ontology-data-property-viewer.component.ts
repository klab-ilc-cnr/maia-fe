import { Component, OnInit } from '@angular/core';
import { of, take } from 'rxjs';
import { OntologyAnnotations } from 'src/app/models/ontology/ontology-annotations.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-ontology-data-property-viewer',
  templateUrl: './ontology-data-property-viewer.component.html',
  styleUrls: ['./ontology-data-property-viewer.component.scss']
})
export class OntologyDataPropertyViewerComponent implements OnInit {
  /** onotology element data */
  public annotationsData!: Array<OntologyAnnotations>

  /**ontology element id */
  private id!: string;

  constructor(private commonService: CommonService) { }

  ngOnInit(): void {
    //FIXME usare il servizio backend
    this.simuleGetClassData(this.id).pipe(
      take(1),
    ).subscribe({
      next: (dataResults) => {
        this.annotationsData = dataResults;
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
      }
    });
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  simuleGetClassData(classId: string) {
    return of(this.retrieveData(classId));
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  retrieveData(classId: string): Array<OntologyAnnotations> {
    let data1 = new OntologyAnnotations();
    data1.id = classId;
    data1.prefix = "rdfs";
    data1.shortId = "label";
    data1.target = "viscose";
    data1.language = "fr";
    let data2 = new OntologyAnnotations();
    data2.id = classId;
    data2.prefix = "rdfs";
    data2.shortId = "label";
    data2.target = "mia etichetta";
    data2.language = undefined;
    let data3 = new OntologyAnnotations();
    data3.id = classId;
    data3.prefix = "skos";
    data3.shortId = "definition";
    data3.target = "mia definizione";
    data3.language = "it";

    const result = [data1, data2, data3];

    return result;
  }
}
