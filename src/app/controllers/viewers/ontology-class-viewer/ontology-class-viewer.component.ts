import { Component, OnInit } from '@angular/core';
import { of, take } from 'rxjs';
import { OntologyAnnotations } from 'src/app/models/ontology/ontology-annotations.model';
import { Axiom, Instance, OntologyDescription } from 'src/app/models/ontology/ontology-description.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-ontology-class-viewer',
  templateUrl: './ontology-class-viewer.component.html',
  styleUrls: ['./ontology-class-viewer.component.scss']
})
export class OntologyClassViewerComponent implements OnInit {

  /** onotology element data */
  public annotationsData!: Array<OntologyAnnotations>
  public descriptionData!: OntologyDescription

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
  retrieveAnnotationsData(classId: string): Array<OntologyAnnotations> {
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
  retrieveDescriptionData(classId: string): OntologyDescription {
    let result = new OntologyDescription();

    let data1Value = new Axiom();
    data1Value.axiom = "resultingFrom only PROCEDE_VISCOSE";
    result.equivalentTo = [data1Value];

    let data2Value = new Axiom();
    data2Value.axiom = "ID4_FRIBRANNE_1";
    result.subClassOf = [data2Value];

    let data3Value = new Axiom();
    data3Value.axiom = "";
    result.generalClassAxioms = [data3Value];

    let data4Value = new Axiom();
    data4Value.axiom = "espressione logica";
    let data4bisValue = new Axiom();
    data4bisValue.axiom = "espressione logica2";
    result.subClassOfAnonymousAncestor = [data4Value, data4bisValue];

    let data41Value = new Instance();
    data41Value.id = "http://test/ontology/v1#i1";
    data41Value.shortId = "i1";
    let data42Value = new Instance();
    data42Value.id = "http://test/ontology/v1#lo";
    data42Value.shortId = "lo";
    let data43Value = new Instance();
    data43Value.id = "http://test/ontology/v1#la";
    data43Value.shortId = "ia";
    result.instances = [data41Value, data42Value, data43Value];

    result.targetForKey = [data3Value];
    result.disjointWith = [data3Value];
    result.disjointUnionOf = [data3Value];

    return result;
  }

}
