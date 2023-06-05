import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguagesViewComponent } from './languages-view.component';

describe('LanguagesViewComponent', () => {
  let component: LanguagesViewComponent;
  let fixture: ComponentFixture<LanguagesViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LanguagesViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LanguagesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
