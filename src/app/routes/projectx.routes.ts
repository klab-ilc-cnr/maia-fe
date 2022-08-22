import { LayerComponent } from "../pages/layer/layer.component";
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
        component: LayerComponent
    }
];
