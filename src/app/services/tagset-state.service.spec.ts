import { TestBed } from '@angular/core/testing';

import { TagsetStateService } from './tagset-state.service';

describe('TagsetStateService', () => {
  let service: TagsetStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TagsetStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
