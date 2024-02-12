import { TestBed } from '@angular/core/testing';

import { SystemStateService } from './system-state.service';

describe('SystemStateService', () => {
  let service: SystemStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SystemStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
