import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultipleTextAnnotationEditorComponent } from './multiple-text-annotation-editor.component';

describe('MultipleTextAnnotationEditorComponent', () => {
  let component: MultipleTextAnnotationEditorComponent;
  let fixture: ComponentFixture<MultipleTextAnnotationEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MultipleTextAnnotationEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultipleTextAnnotationEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
