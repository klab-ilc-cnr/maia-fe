import { WorkspaceListComponent } from "../pages/workspace/workspace-list/workspace-list.component";

/**Routes related to the different pages of the application */
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
    },
    {
      path: 'lexicon',
      loadChildren: () => import('../modules/lexicon.module').then(m => m.LexiconModule),
    },
];
