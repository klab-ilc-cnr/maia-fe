import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceDictionaryTileComponent } from './workspace-dictionary-tile.component';

describe('WorkspaceDictionaryTileComponent', () => {
  let component: WorkspaceDictionaryTileComponent;
  let fixture: ComponentFixture<WorkspaceDictionaryTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceDictionaryTileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceDictionaryTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
