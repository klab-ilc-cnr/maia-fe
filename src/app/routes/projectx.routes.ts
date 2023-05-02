import { WorkspaceListComponent } from "../pages/workspace/workspace-list/workspace-list.component";

/**Route relative alle diverse pagine dell'applicazione */
export const PROJECTX_ROUTES = [
    {
        path: 'usersManagement',
        loadChildren: () => import('../modules/users-management.module').then(m => m.UsersManagementModule)
    },
    {
        path: 'workspaces',
        component: WorkspaceListComponent
    },
    {
        path: 'layers',
        loadChildren: () => import('../modules/layers.module').then(m => m.LayersModule)
    },
    {
        path: 'tagsets',
        loadChildren: () => import('../modules/tagsets.module').then(m => m.TagsetsModule)
    }
];
