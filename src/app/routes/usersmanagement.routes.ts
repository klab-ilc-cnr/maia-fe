import { UserFormComponent } from "../pages/usersManagement/user-form/user-form.component";
import { UserListComponent } from "../pages/usersManagement/user-list/user-list.component";

/**Routes related to user management */
export const USERSMANAGEMENT_ROUTES = [
    {
        path: 'users',
        component: UserListComponent
    },
    {
        path: 'userDetails/:id',
        component: UserFormComponent
    },
    {
        path: 'userDetails',
        component: UserFormComponent
    }
];
