import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LexicalEntryEditorComponent } from './lexical-entry-editor.component';

describe('LexicalEntryEditorComponent', () => {
  let component: LexicalEntryEditorComponent;
  let fixture: ComponentFixture<LexicalEntryEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LexicalEntryEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LexicalEntryEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
