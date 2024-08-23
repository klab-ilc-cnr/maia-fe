import { Component, OnInit } from '@angular/core';
import { of, take } from 'rxjs';
import { OntologyAnnotations } from 'src/app/models/ontology/ontology-annotations.model';
import { OntologyDescriptionInstance } from 'src/app/models/ontology/ontology-description-instance.model';
import { OntologyIndividualDescription } from 'src/app/models/ontology/ontology-individual-description.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-ontology-individual-viewer',
  templateUrl: './ontology-individual-viewer.component.html',
  styleUrls: ['./ontology-individual-viewer.component.scss', '../common/shared.scss']
})
export class OntologyIndividualViewerComponent implements OnInit {
  /** onotology element data */
  public annotationsData!: Array<OntologyAnnotations>
  /** onotology description data */
  public descriptions!: OntologyIndividualDescription

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

    //FIXME usare il servizio backend
    this.simuleGetDescriptionData(this.id).pipe(
      take(1),
    ).subscribe({
      next: (descriptionResults) => {
        this.descriptions = descriptionResults;
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

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  simuleGetDescriptionData(classId: string) {
    return of(this.retrieveDescriptionData(classId));
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  retrieveDescriptionData(classId: string): OntologyIndividualDescription {
    let result = new OntologyIndividualDescription();
    
    let data1Value = new OntologyDescriptionInstance();
    data1Value.id = "http://test/ontology/v1#i1";
    data1Value.shortId = "i1";
    result.types = [data1Value]
    result.differentFrom = [data1Value];

    let data41Value = new OntologyDescriptionInstance();
    data41Value.id = "http://test/ontology/v1#i1";
    data41Value.shortId = "i1";
    let data42Value = new OntologyDescriptionInstance();
    data42Value.id = "http://test/ontology/v1#lo";
    data42Value.shortId = "lo";
    let data43Value = new OntologyDescriptionInstance();
    data43Value.id = "http://test/ontology/v1#la";
    data43Value.shortId = "ia";
    result.sameAs = [data41Value, data42Value, data43Value];

    return result;
  }
}
