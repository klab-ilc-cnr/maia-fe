import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DictionaryEntryFullEditorComponent } from './dictionary-entry-full-editor.component';

describe('DictionaryEntryFullEditorComponent', () => {
  let component: DictionaryEntryFullEditorComponent;
  let fixture: ComponentFixture<DictionaryEntryFullEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DictionaryEntryFullEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DictionaryEntryFullEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
