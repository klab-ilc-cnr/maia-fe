import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceLexiconTileComponent } from './workspace-lexicon-tile.component';

describe('WorkspaceLexiconTileComponent', () => {
  let component: WorkspaceLexiconTileComponent;
  let fixture: ComponentFixture<WorkspaceLexiconTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceLexiconTileComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceLexiconTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
