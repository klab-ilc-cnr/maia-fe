import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagsetsListComponent } from './tagsets-list.component';

describe('TagsetsListComponent', () => {
  let component: TagsetsListComponent;
  let fixture: ComponentFixture<TagsetsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TagsetsListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TagsetsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
