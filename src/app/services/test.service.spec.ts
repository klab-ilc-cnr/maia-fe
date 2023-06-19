import { TestBed } from '@angular/core/testing';

import { GlobalStateService } from './global-state.service';

describe('TestService', () => {
  let service: GlobalStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GlobalStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
