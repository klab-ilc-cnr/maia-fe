import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationEditorComponent } from './relation-editor.component';

describe('RelationEditorComponent', () => {
  let component: RelationEditorComponent;
  let fixture: ComponentFixture<RelationEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RelationEditorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RelationEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
