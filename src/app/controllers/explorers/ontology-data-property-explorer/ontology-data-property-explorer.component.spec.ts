import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyDataPropertyExplorerComponent } from './ontology-data-property-explorer.component';

describe('OntologyDataPropertyViewerComponent', () => {
  let component: OntologyDataPropertyExplorerComponent;
  let fixture: ComponentFixture<OntologyDataPropertyExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyDataPropertyExplorerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyDataPropertyExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
