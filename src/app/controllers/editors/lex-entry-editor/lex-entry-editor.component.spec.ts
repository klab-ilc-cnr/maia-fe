import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LexEntryEditorComponent } from './lex-entry-editor.component';

describe('LexEntryEditorComponent', () => {
  let component: LexEntryEditorComponent;
  let fixture: ComponentFixture<LexEntryEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LexEntryEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LexEntryEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
