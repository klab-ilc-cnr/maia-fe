import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LexEntryDecompComponent } from './lex-entry-decomp.component';

describe('LexEntryDecompComponent', () => {
  let component: LexEntryDecompComponent;
  let fixture: ComponentFixture<LexEntryDecompComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LexEntryDecompComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LexEntryDecompComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
