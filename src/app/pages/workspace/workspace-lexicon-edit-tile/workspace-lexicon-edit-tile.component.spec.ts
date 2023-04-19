import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceLexiconEditTileComponent } from './workspace-lexicon-edit-tile.component';

describe('WorkspaceLexiconEditTileComponent', () => {
  let component: WorkspaceLexiconEditTileComponent;
  let fixture: ComponentFixture<WorkspaceLexiconEditTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceLexiconEditTileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceLexiconEditTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
