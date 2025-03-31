import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceOntologyExplorerComponent } from './workspace-ontology-explorer.component';

describe('WorkspaceOntologyTileComponent', () => {
  let component: WorkspaceOntologyExplorerComponent;
  let fixture: ComponentFixture<WorkspaceOntologyExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceOntologyExplorerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceOntologyExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
