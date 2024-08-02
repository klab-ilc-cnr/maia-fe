import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyIndividualsViewerComponent } from './ontology-individuals-viewer.component';

describe('OntologyIndividualsViewerComponent', () => {
  let component: OntologyIndividualsViewerComponent;
  let fixture: ComponentFixture<OntologyIndividualsViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyIndividualsViewerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyIndividualsViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
