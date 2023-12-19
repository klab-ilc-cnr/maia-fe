import { TagsetCreateEditComponent } from '../pages/tagsets/tagset-create-edit/tagset-create-edit.component';
import { TagsetsListComponent } from "../pages/tagsets/tagsets-list/tagsets-list.component";

/**Routes related to tagset management */
export const TAGSETS_ROUTES = [
    {
        path: '',
        component: TagsetsListComponent
    },
    {
        path: ':id',
        component: TagsetCreateEditComponent
    }
];
