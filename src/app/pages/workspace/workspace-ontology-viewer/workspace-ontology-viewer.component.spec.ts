import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceOntologyViewerComponent } from './workspace-ontology-viewer.component';

describe('WorkspaceOntologyViewerComponent', () => {
  let component: WorkspaceOntologyViewerComponent;
  let fixture: ComponentFixture<WorkspaceOntologyViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceOntologyViewerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceOntologyViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
