import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceSearchTileComponent } from './workspace-search-tile.component';

describe('WorkspaceSearchTileComponent', () => {
  let component: WorkspaceSearchTileComponent;
  let fixture: ComponentFixture<WorkspaceSearchTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceSearchTileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceSearchTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
