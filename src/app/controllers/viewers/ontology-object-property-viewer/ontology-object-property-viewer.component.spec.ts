import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyObjectPropertyViewerComponent } from './ontology-object-property-viewer.component';

describe('OntologyObjectPropertyViewerComponent', () => {
  let component: OntologyObjectPropertyViewerComponent;
  let fixture: ComponentFixture<OntologyObjectPropertyViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyObjectPropertyViewerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyObjectPropertyViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
