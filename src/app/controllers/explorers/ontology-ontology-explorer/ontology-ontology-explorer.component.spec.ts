import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyOntologyExplorerComponent } from './ontology-ontology-explorer.component';

describe('OntologyOntologyExplorerComponent', () => {
  let component: OntologyOntologyExplorerComponent;
  let fixture: ComponentFixture<OntologyOntologyExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyOntologyExplorerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyOntologyExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
