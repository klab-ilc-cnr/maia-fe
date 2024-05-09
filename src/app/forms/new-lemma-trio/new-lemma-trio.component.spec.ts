import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewLemmaTrioComponent } from './new-lemma-trio.component';

describe('NewLemmaTrioComponent', () => {
  let component: NewLemmaTrioComponent;
  let fixture: ComponentFixture<NewLemmaTrioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewLemmaTrioComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewLemmaTrioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
