import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagsetCreateEditComponent } from './tagset-create-edit.component';

describe('TagsetCreateEditComponent', () => {
  let component: TagsetCreateEditComponent;
  let fixture: ComponentFixture<TagsetCreateEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TagsetCreateEditComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TagsetCreateEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
