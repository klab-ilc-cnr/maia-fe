import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DictionaryEntryReferralEditorComponent } from './dictionary-entry-referral-editor.component';

describe('DictionaryEntryReferralEditorComponent', () => {
  let component: DictionaryEntryReferralEditorComponent;
  let fixture: ComponentFixture<DictionaryEntryReferralEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DictionaryEntryReferralEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DictionaryEntryReferralEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
