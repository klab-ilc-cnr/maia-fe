import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemanticRelIndirectComponent } from './semantic-rel-indirect.component';

describe('SemanticRelIndirectComponent', () => {
  let component: SemanticRelIndirectComponent;
  let fixture: ComponentFixture<SemanticRelIndirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SemanticRelIndirectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemanticRelIndirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
