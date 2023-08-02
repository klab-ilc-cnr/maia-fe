import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericAutocompleteComponent } from './generic-autocomplete.component';

describe('GenericAutocompleteComponent', () => {
  let component: GenericAutocompleteComponent;
  let fixture: ComponentFixture<GenericAutocompleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenericAutocompleteComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
