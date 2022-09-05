import { TestBed } from '@angular/core/testing';

import { TagsetService } from './tagset.service';

describe('TagsetService', () => {
  let service: TagsetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TagsetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
