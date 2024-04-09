import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewDictionaryEntryComponent } from './new-dictionary-entry.component';

describe('NewDictionaryEntryComponent', () => {
  let component: NewDictionaryEntryComponent;
  let fixture: ComponentFixture<NewDictionaryEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewDictionaryEntryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewDictionaryEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
