import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyIndividualsExplorerComponent } from './ontology-individuals-explorer.component';

describe('OntologyIndividualsViewerComponent', () => {
  let component: OntologyIndividualsExplorerComponent;
  let fixture: ComponentFixture<OntologyIndividualsExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyIndividualsExplorerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyIndividualsExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
