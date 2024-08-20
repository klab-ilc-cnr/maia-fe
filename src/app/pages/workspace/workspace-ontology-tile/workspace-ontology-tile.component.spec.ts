import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceOntologyTileComponent } from './workspace-ontology-tile.component';

describe('WorkspaceOntologyTileComponent', () => {
  let component: WorkspaceOntologyTileComponent;
  let fixture: ComponentFixture<WorkspaceOntologyTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceOntologyTileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceOntologyTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
