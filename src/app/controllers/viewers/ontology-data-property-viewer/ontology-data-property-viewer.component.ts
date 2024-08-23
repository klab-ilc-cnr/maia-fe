import { Component, Input, OnInit } from '@angular/core';
import { of, range, take } from 'rxjs';
import { OntologyAnnotations } from 'src/app/models/ontology/ontology-annotations.model';
import { OntologyDataPropertyCharacteristics } from 'src/app/models/ontology/ontology-data-property-characteristics.model';
import { OntologyDataPropertyDescription } from 'src/app/models/ontology/ontology-data-property-description.model';
import { OntologyDescriptionAxiom } from 'src/app/models/ontology/ontology-description-axiom.model';
import { CharacterisctType } from 'src/app/models/ontology/ontology-object-property-characteristics.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-ontology-data-property-viewer',
  templateUrl: './ontology-data-property-viewer.component.html',
  styleUrls: ['./ontology-data-property-viewer.component.scss', '../common/shared.scss']
})
export class OntologyDataPropertyViewerComponent implements OnInit {
  /**ontology element id */
  @Input()
  public propertyId!: string;

  /** onotology element data */
  public annotations!: Array<OntologyAnnotations>
  /** onotology description data */
  public descriptions!: OntologyDataPropertyDescription
  /** onotology characteristics data */
  public characteristics!: OntologyDataPropertyCharacteristics

  constructor(private commonService: CommonService) { }

  ngOnInit(): void {
    //FIXME usare il servizio backend
    this.simuleGetClassData(this.propertyId).pipe(
      take(1),
    ).subscribe({
      next: (dataResults) => {
        this.annotations = dataResults;
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
      }
    });

    //FIXME usare il servizio backend
    this.simuleGetDescriptionData(this.propertyId).pipe(
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
    this.simuleGetCharacteristicsData(this.propertyId, CharacterisctType.data).pipe(
      take(1),
    ).subscribe({
      next: (characteristics) => {
        this.characteristics = characteristics;
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
  retrieveDescriptionData(classId: string): OntologyDataPropertyDescription {
    let result = new OntologyDataPropertyDescription();

    let data1Value = new OntologyDescriptionAxiom();
    data1Value.axiom = "resultingFrom only PROCEDE_VISCOSE";
    result.equivalentTo = [data1Value];

    let data2Value = new OntologyDescriptionAxiom();
    data2Value.axiom = "ID4_FRIBRANNE_1";
    result.subPropertyOf = [data2Value];

    let data3Value = new OntologyDescriptionAxiom();
    data3Value.axiom = "";
    result.inverseOf = [data3Value];

    let data4Value = new OntologyDescriptionAxiom();
    data4Value.axiom = "espressione logica";
    let data4bisValue = new OntologyDescriptionAxiom();
    data4bisValue.axiom = "espressione logica2";
    result.domains = [data4Value, data4bisValue];

    let rangeData = new OntologyDescriptionAxiom();
    rangeData.axiom = "xsd:integer"
    result.ranges = [rangeData];

    result.disjointWith = [data3Value];

    let superData = new OntologyDescriptionAxiom();
    superData.axiom = "data di super"
    result.superPropertyOfChain = [superData];

    return result;
  }

    //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
    simuleGetCharacteristicsData(classId: string, type: CharacterisctType) {
      return of(this.retrieveCharacteristicsData(classId, type));
    }
  
    //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
    retrieveCharacteristicsData(classId: string, type: CharacterisctType): OntologyDataPropertyCharacteristics {
      let result = new OntologyDataPropertyCharacteristics();
  
      result.functional = true;
  
      return result;
    }
}
