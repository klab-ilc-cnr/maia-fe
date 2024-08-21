import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacteristicsFieldComponent } from './characteristics-field.component';

describe('CharacteristicsFieldComponent', () => {
  let component: CharacteristicsFieldComponent;
  let fixture: ComponentFixture<CharacteristicsFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CharacteristicsFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacteristicsFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
