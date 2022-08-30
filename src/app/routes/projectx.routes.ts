import { LayersListComponent } from './../pages/layers/layers-list/layers-list.component';
import { WorkspaceListComponent } from "../pages/workspace/workspace-list/workspace-list.component";
import { USERSMANAGEMENT_ROUTES } from "./usersmanagement.routes";
import { WORKSPACES_ROUTES } from "./workspaces.routes";

export const PROJECTX_ROUTES = [
    {
        path: 'usersManagement',
        children: USERSMANAGEMENT_ROUTES
    },
    {
        path: 'workspaces',
        component: WorkspaceListComponent
    },
    {
        path: 'layers',
        component: LayersListComponent
    }
];
