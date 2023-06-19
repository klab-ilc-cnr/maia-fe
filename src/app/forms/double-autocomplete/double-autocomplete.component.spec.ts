import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoubleAutocompleteComponent } from './double-autocomplete.component';

describe('DoubleAutocompleteComponent', () => {
  let component: DoubleAutocompleteComponent;
  let fixture: ComponentFixture<DoubleAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DoubleAutocompleteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoubleAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
