import { Component, Input, OnInit } from '@angular/core';
import { of, take } from 'rxjs';
import { OntologyDenoteUsage } from 'src/app/models/ontology/ontology-denote-usage.model';
import { OntologyReferenceUsage } from 'src/app/models/ontology/ontology-reference-usage.model';
import { CommonService } from 'src/app/services/common.service';

@Component({
  selector: 'app-ontology-tab-usage',
  templateUrl: './ontology-tab-usage.component.html',
  styleUrls: ['./ontology-tab-usage.component.scss', '../shared.scss']
})
export class OntologyTabUsageComponent implements OnInit {
  /**ontology element id */
  @Input()
  public id!: string;

  /** onotology denotes data */
  public references!: Array<OntologyReferenceUsage>
  /** onotology denotes data */
  public denotes!: Array<OntologyDenoteUsage>

  constructor(private commonService: CommonService) { }

  ngOnInit(): void {
    //FIXME usare il servizio backend
    this.simuleGetReferences(this.id).pipe(
      take(1),
    ).subscribe({
      next: (referenceResults) => {
        this.references = referenceResults;
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
      }
    });

    //FIXME usare il servizio backend
    this.simuleGetDenote(this.id).pipe(
      take(1),
    ).subscribe({
      next: (denoteResults) => {
        this.denotes = denoteResults;
      },
      error: (error) => {
        this.commonService.throwHttpErrorAndMessage(error, `Loading data failed: ${error.error.message}`);
      }
    });
  }

  extractPosLabel(extendedPosString: string) {
    let indiceHash = extendedPosString.indexOf("#");
    return extendedPosString.substring(indiceHash + 1);
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  simuleGetDenote(classId: string) {
    return of(this.retrieveDenoteData(classId));
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  retrieveDenoteData(classId: string): Array<OntologyDenoteUsage> {
    let result = new Array<OntologyDenoteUsage>();

    let data1Value = new OntologyDenoteUsage();
    data1Value.lexicalEntryId = classId;
    data1Value.lexicalEntryLabel = "allontanare";
    data1Value.pos = "http://www.lexinfo.net/ontology/3.0/lexinfo#verb";
    data1Value.language = "it";

    let data2Value = new OntologyDenoteUsage();
    data2Value.lexicalEntryId = classId;
    data2Value.lexicalEntryLabel = "allontanare";
    data2Value.pos = "http://www.lexinfo.net/ontology/3.0/lexinfo#verb";
    data2Value.language = "it";

    let data3Value = new OntologyDenoteUsage();
    data3Value.lexicalEntryId = classId;
    data3Value.lexicalEntryLabel = "allontanare";
    data3Value.pos = "http://www.lexinfo.net/ontology/3.0/lexinfo#verb";
    data3Value.language = "it";

    result = [data1Value, data2Value, data3Value];

    return result;
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  simuleGetReferences(classId: string) {
    return of(this.retrieveReferenceData(classId));
  }

  //TODO ELIMINARE APPENA SARà CREATO IL VERO SERVIZIO BACKEND
  retrieveReferenceData(classId: string): Array<OntologyReferenceUsage> {
    let result = new Array<OntologyReferenceUsage>();

    let data1Value = new OntologyReferenceUsage();
    data1Value.lexicalEntryId = classId;
    data1Value.lexicalEntryLabel = "sparire";
    data1Value.definition = "Sottrarsi d'un tratto o velocemente alla vista"
    data1Value.pos = "http://www.lexinfo.net/ontology/3.0/lexinfo#verb";
    data1Value.language = "it";

    let data2Value = new OntologyReferenceUsage();
    data2Value.lexicalEntryId = classId;
    data2Value.lexicalEntryLabel = "dileguare";
    data2Value.definition = "Sottrarsi alla vista altrui"
    data2Value.pos = "http://www.lexinfo.net/ontology/3.0/lexinfo#verb";
    data2Value.language = "it";

    let data3Value = new OntologyReferenceUsage();
    data3Value.lexicalEntryId = classId;
    data3Value.lexicalEntryLabel = "esempio";
    data3Value.definition = "definizione d'esempio"
    data3Value.pos = "http://www.lexinfo.net/ontology/3.0/lexinfo#verb";
    data3Value.language = "it";

    result = [data1Value, data2Value, data3Value, data3Value, data3Value, data3Value, data3Value, data3Value, data3Value, data3Value, data3Value];

    return result;
  }

}
