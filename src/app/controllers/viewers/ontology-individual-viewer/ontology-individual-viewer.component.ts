import { Component, Input, OnInit } from '@angular/core';
import { of, take } from 'rxjs';
import { OntologyAnnotations } from 'src/app/models/ontology/ontology-annotations.model';
import { OntologyDescriptionInstance } from 'src/app/models/ontology/ontology-description-instance.model';
import { OntologyIndividualDescription } from 'src/app/models/ontology/ontology-individual-description.model';
import { OntologyPropertyAssertionData } from 'src/app/models/ontology/ontology-property-assertion-data.model';
import { OntologyPropertyAssertionObject } from 'src/app/models/ontology/ontology-property-assertion-object.model';
import { AssertionType, OntologyDataPropertyAssertions, OntologyObjectPropertyAssertions } from 'src/app/models/ontology/ontology-property-assertions.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-ontology-individual-viewer',
  templateUrl: './ontology-individual-viewer.component.html',
  styleUrls: ['./ontology-individual-viewer.component.scss', '../common/shared.scss']
})
export class OntologyIndividualViewerComponent implements OnInit {
  /**ontology element id */
  @Input()
  public instanceId!: string;

  /** onotology element data */
  public annotationsData!: Array<OntologyAnnotations>
  /** onotology description data */
  public descriptions!: OntologyIndividualDescription
  /** onotology characteristics data */
  public objectPropertyAssertions!: OntologyObjectPropertyAssertions
  /** onotology characteristics data */
  public dataPropertyAssertions!: OntologyDataPropertyAssertions

  constructor(private commonService: CommonService) { }

  ngOnInit(): void {
    //FIXME usare il servizio backend
    this.simuleGetClassData(this.instanceId).pipe(
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
    this.simuleGetDescriptionData(this.instanceId).pipe(
      take(1),
    ).subscribe({
      next: (descriptionResults) => {
        this.descriptions = descriptionResults;
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
      }
    });

    //FIXME usare il servizio backend
    this.simuleGetObjectAssertions(this.instanceId, AssertionType.object).pipe(
      take(1),
    ).subscribe({
      next: (objectAssertions) => {
        this.objectPropertyAssertions = objectAssertions;
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
      }
    });

    //FIXME usare il servizio backend
    this.simuleGetDataAssertions(this.instanceId, AssertionType.data).pipe(
      take(1),
    ).subscribe({
      next: (dataAssertions) => {
        this.dataPropertyAssertions = dataAssertions;
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

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  simuleGetObjectAssertions(classId: string, type: AssertionType) {
    return of(this.retrieveObjectCharacteristicsData(classId));

  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  simuleGetDataAssertions(classId: string, type: AssertionType) {
    return of(this.retrieveDataCharacteristicsData(classId));
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  retrieveObjectCharacteristicsData(classId: string): OntologyObjectPropertyAssertions {
    let result = new OntologyObjectPropertyAssertions();

    let data2 = new OntologyPropertyAssertionObject();
    data2.shortId = "test shortId";
    data2.shortIdTarget = "test id target"
    result.objectPropertyAssertions = [data2];

    result.negativeObjectPropertyAssertions = [data2]

    return result;
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  retrieveDataCharacteristicsData(classId: string): OntologyDataPropertyAssertions {
    let result = new OntologyDataPropertyAssertions();

    let data = new OntologyPropertyAssertionData();
    data.shortId = "bo";
    data.target = "test"
    result.dataPropertyAssertions = [data];

    result.negativeDataPropertyAssertions = [data]


    return result;
  }
}
