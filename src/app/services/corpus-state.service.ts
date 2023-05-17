import { Injectable } from '@angular/core';
import { WorkspaceService } from './workspace.service';
import { Subject, merge, shareReplay, switchMap } from 'rxjs';

@Injectable()
export class CorpusStateService {
  refreshFileSystem = new Subject();
  filesystem$ = merge(
    this.workspaceService.retrieveCorpus(),
    this.refreshFileSystem.pipe(
      switchMap(() => this.workspaceService.retrieveCorpus())
    ),
  ).pipe(
    shareReplay(1)
  )

  constructor(
    private workspaceService: WorkspaceService,
  ) {
    this.refreshFileSystem.subscribe();
  }
}
