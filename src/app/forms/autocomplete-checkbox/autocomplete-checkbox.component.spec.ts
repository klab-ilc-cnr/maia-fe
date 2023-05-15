import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutocompleteCheckboxComponent } from './autocomplete-checkbox.component';

describe('AutocompleteCheckboxComponent', () => {
  let component: AutocompleteCheckboxComponent;
  let fixture: ComponentFixture<AutocompleteCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AutocompleteCheckboxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutocompleteCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
