import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextAnnotationEditorComponent } from './text-annotation-editor.component';

describe('TextAnnotationEditorComponent', () => {
  let component: TextAnnotationEditorComponent;
  let fixture: ComponentFixture<TextAnnotationEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextAnnotationEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TextAnnotationEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
