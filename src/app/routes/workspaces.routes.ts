import { WorkspaceListComponent } from "../workspace-list/workspace-list.component";
import { WorkspaceComponent } from "../workspace/workspace.component";


export const WORKSPACES_ROUTES = [
    {
        path: '',
        component: WorkspaceListComponent
    },
    {
        path: ':id',
        component: WorkspaceComponent
    },
];
