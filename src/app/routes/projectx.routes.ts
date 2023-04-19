import { TAGSETS_ROUTES } from './tagsets.routes';
import { LayersListComponent } from './../pages/layers/layers-list/layers-list.component';
import { WorkspaceListComponent } from "../pages/workspace/workspace-list/workspace-list.component";
import { USERSMANAGEMENT_ROUTES } from "./usersmanagement.routes";
import { WORKSPACES_ROUTES } from "./workspaces.routes";
import { LAYERS_ROUTES } from './layers.routes';

/**Route relative alle diverse pagine dell'applicazione */
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
        children: LAYERS_ROUTES
    },
    {
        path: 'tagsets',
        children: TAGSETS_ROUTES
    }
];
