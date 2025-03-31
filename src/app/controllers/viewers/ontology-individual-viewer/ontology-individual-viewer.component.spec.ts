import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyIndividualViewerComponent } from './ontology-individual-viewer.component';

describe('OntologyIndividualViewerComponent', () => {
  let component: OntologyIndividualViewerComponent;
  let fixture: ComponentFixture<OntologyIndividualViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyIndividualViewerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyIndividualViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
