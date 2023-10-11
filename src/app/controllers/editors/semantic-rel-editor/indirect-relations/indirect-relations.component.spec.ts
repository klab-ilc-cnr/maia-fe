import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IndirectRelationsComponent } from './indirect-relations.component';

describe('IndirectRelationsComponent', () => {
  let component: IndirectRelationsComponent;
  let fixture: ComponentFixture<IndirectRelationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IndirectRelationsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IndirectRelationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
