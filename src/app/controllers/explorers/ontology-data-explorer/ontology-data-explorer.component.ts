import { Component, OnInit } from '@angular/core';
import { OntologyData } from 'src/app/models/ontology/ontology-data.model';
import { OntologyService } from 'src/app/services/ontology.service';

@Component({
  selector: 'app-ontology-data-explorer',
  templateUrl: './ontology-data-explorer.component.html',
  styleUrls: ['./ontology-data-explorer.component.scss']
})
export class OntologyDataExplorerComponent implements OnInit {

  public ontologyData!: OntologyData;

  constructor(private ontologyService: OntologyService) { }

  ngOnInit(): void {
    this.ontologyService.getOntologyData().subscribe((data) => {
      this.ontologyData = data;
    })
  }

}
