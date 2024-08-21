import { Component, OnInit } from '@angular/core';
import { of, take } from 'rxjs';
import { OntologyAnnotationsField } from 'src/app/models/ontology/ontology-annotations-field.model';
import { Axiom, Instance, OntologyDescriptionField } from 'src/app/models/ontology/ontology-description-field.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-ontology-class-viewer',
  templateUrl: './ontology-class-viewer.component.html',
  styleUrls: ['./ontology-class-viewer.component.scss']
})
export class OntologyClassViewerComponent implements OnInit {

  /** onotology element data */
  public annotationsData!: Array<OntologyAnnotationsField>
  public descriptionData!: Array<OntologyDescriptionField>

  /**ontology element id */
  private id!: string;

  constructor(private commonService: CommonService) { }

  ngOnInit(): void {
    //FIXME usare il servizio backend
    this.simuleGetAnnotationData(this.id).pipe(
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
        this.descriptionData = descriptionResults;
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
      }
    });
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  simuleGetAnnotationData(classId: string) {
    return of(this.retrieveAnnotationsData(classId));
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  simuleGetDescriptionData(classId: string) {
    return of(this.retrieveDescriptionData(classId));
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  retrieveAnnotationsData(classId: string): Array<OntologyAnnotationsField> {
    let data1 = new OntologyAnnotationsField();
    data1.id = classId;
    data1.prefix = "rdfs";
    data1.shortId = "label";
    data1.target = "viscose";
    data1.language = "fr";
    let data2 = new OntologyAnnotationsField();
    data2.id = classId;
    data2.prefix = "rdfs";
    data2.shortId = "label";
    data2.target = "mia etichetta";
    data2.language = undefined;
    let data3 = new OntologyAnnotationsField();
    data3.id = classId;
    data3.prefix = "skos";
    data3.shortId = "definition";
    data3.target = "mia definizione";
    data3.language = "it";

    const result = [data1, data2, data3];

    return result;
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  retrieveDescriptionData(classId: string): Array<OntologyDescriptionField> {
    let data1 = new OntologyDescriptionField();
    data1.key = "equivalentTo";
    let data1Value = new Axiom();
    data1Value.axiom = "resultingFrom only PROCEDE_VISCOSE";
    data1.value = [data1Value];

    let data2 = new OntologyDescriptionField();
    data2.key = "subclassOf";
    let data2Value = new Axiom();
    data2Value.axiom = "ID4_FRIBRANNE_1";
    data2.value = [data2Value];

    let data3 = new OntologyDescriptionField();
    data3.key = "generalClassAxioms";
    let data3Value = new Axiom();
    data3Value.axiom = "";
    data3.value = [data3Value];

    let data4 = new OntologyDescriptionField();
    data4.key = "subClassOfAnonymousAncestor";
    let data41Value = new Instance();
    data41Value.id = "http://test/ontology/v1#i1";
    data41Value.shortId = "i1";
    let data42Value = new Instance();
    data42Value.id = "http://test/ontology/v1#lo";
    data42Value.shortId = "lo";
    let data43Value = new Instance();
    data43Value.id = "http://test/ontology/v1#la";
    data43Value.shortId = "ia";
    data4.value = [data41Value, data42Value, data43Value];

    let data5 = new OntologyDescriptionField();
    data5.key = "instances";
    let data5Value = new Axiom();
    data5Value.axiom = "id5";
    data5.value = [data5Value];

    let data6 = new OntologyDescriptionField();
    data6.key = "targetForKey";
    let data6Value = new Axiom();
    data6Value.axiom = "";
    data6.value = [data6Value];

    let data7 = new OntologyDescriptionField();
    data7.key = "disjointWith";
    let data7Value = new Axiom();
    data7Value.axiom = "";
    data7.value = [data7Value];

    let data8 = new OntologyDescriptionField();
    data8.key = "disjointUnionOf";
    let data8Value = new Axiom();
    data8Value.axiom = "";
    data8.value = [data3Value];
    
    const result = [data1, data2, data3, data4, data5, data6, data7, data8];

    return result;
  }

}
