import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyClassExplorerComponent } from './ontology-class-explorer.component';

describe('OntologyClassViewerComponent', () => {
  let component: OntologyClassExplorerComponent;
  let fixture: ComponentFixture<OntologyClassExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyClassExplorerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyClassExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
