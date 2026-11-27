import { UserFormComponent } from "../pages/usersManagement/user-form/user-form.component";
import { UserListComponent } from "../pages/usersManagement/user-list/user-list.component";
import { PendingChangesGuard } from "../pending-changes-guard";

/**Routes related to user management */
export const USERSMANAGEMENT_ROUTES = [
    {
        path: 'users',
        component: UserListComponent
    },
    {
        path: 'userDetails/:id',
        component: UserFormComponent,
        canDeactivate: [PendingChangesGuard]
    },
    {
        path: 'userDetails',
        component: UserFormComponent,
        canDeactivate: [PendingChangesGuard]
    }
];
