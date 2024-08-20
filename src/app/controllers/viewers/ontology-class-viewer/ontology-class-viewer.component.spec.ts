import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyClassViewerComponent } from './ontology-class-viewer.component';

describe('OntologyClassViewerComponent', () => {
  let component: OntologyClassViewerComponent;
  let fixture: ComponentFixture<OntologyClassViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyClassViewerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyClassViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
