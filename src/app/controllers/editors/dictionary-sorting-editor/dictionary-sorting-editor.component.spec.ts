import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DictionarySortingEditorComponent } from './dictionary-sorting-editor.component';

describe('DictionarySortingEditorComponent', () => {
  let component: DictionarySortingEditorComponent;
  let fixture: ComponentFixture<DictionarySortingEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DictionarySortingEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DictionarySortingEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
