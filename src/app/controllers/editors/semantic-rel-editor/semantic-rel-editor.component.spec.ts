import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemanticRelEditorComponent } from './semantic-rel-editor.component';

describe('SemanticRelEditorComponent', () => {
  let component: SemanticRelEditorComponent;
  let fixture: ComponentFixture<SemanticRelEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SemanticRelEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemanticRelEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
