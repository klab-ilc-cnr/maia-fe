import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyDataExplorerComponent } from './ontology-data-explorer.component';

describe('OntologyOntologyExplorerComponent', () => {
  let component: OntologyDataExplorerComponent;
  let fixture: ComponentFixture<OntologyDataExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyDataExplorerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyDataExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
