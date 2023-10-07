import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemanticRelInputComponent } from './semantic-rel-input.component';

describe('SemanticRelInputComponent', () => {
  let component: SemanticRelInputComponent;
  let fixture: ComponentFixture<SemanticRelInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SemanticRelInputComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemanticRelInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
