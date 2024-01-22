import { TestBed } from '@angular/core/testing';

import { WorkspaceStateService } from './workspace-state.service';

describe('WorkspaceStatusService', () => {
  let service: WorkspaceStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WorkspaceStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
