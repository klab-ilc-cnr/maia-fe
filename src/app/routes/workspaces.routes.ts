import { WorkspaceComponent } from "../pages/workspace/workspace.component";
import { PendingChangesGuard } from "../pending-changes-guard";

/**Route related to individual workspaces */
export const WORKSPACES_ROUTES = [
    {
        path: 'workspace/:id',
        component: WorkspaceComponent,
        canDeactivate: [PendingChangesGuard]
    },
];
