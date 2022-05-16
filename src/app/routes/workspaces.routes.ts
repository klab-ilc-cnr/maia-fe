import { PendingChangesGuard } from "../pending-changes-guard";
import { WorkspaceLayoutComponent } from "../workspace-layout/workspace-layout.component";
import { WorkspaceListComponent } from "../workspace-list/workspace-list.component";
import { WorkspaceComponent } from "../workspace/workspace.component";


export const WORKSPACES_ROUTES = [
    {
        path: 'workspace/:id',
        component: WorkspaceComponent,
        canDeactivate: [PendingChangesGuard]
    },
];
