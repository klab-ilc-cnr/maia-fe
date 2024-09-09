import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyObjectPropertyExplorerComponent } from './ontology-object-property-explorer.component';

describe('OntologyObjectPropertyViewerComponent', () => {
  let component: OntologyObjectPropertyExplorerComponent;
  let fixture: ComponentFixture<OntologyObjectPropertyExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyObjectPropertyExplorerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyObjectPropertyExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
