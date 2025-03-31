import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OntologyTabUsageComponent } from './ontology-tab-usage.component';

describe('OntologyTabUsageComponent', () => {
  let component: OntologyTabUsageComponent;
  let fixture: ComponentFixture<OntologyTabUsageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OntologyTabUsageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OntologyTabUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
