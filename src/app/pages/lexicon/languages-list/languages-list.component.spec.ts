import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguagesListComponent } from './languages-list.component';

describe('LanguagesListComponent', () => {
  let component: LanguagesListComponent;
  let fixture: ComponentFixture<LanguagesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LanguagesListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LanguagesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
