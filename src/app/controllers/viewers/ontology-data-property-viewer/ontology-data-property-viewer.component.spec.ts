import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyDataPropertyViewerComponent } from './ontology-data-property-viewer.component';

describe('OntologyDataPropertyViewerComponent', () => {
  let component: OntologyDataPropertyViewerComponent;
  let fixture: ComponentFixture<OntologyDataPropertyViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyDataPropertyViewerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyDataPropertyViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
