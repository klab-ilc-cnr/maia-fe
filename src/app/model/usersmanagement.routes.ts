import { UserFormComponent } from "../user-form/user-form.component";
import { UserListComponent } from "../user-list/user-list.component";

export const USERSMANAGEMENT_ROUTES = [
    {
        path: 'users',
        component: UserListComponent
    },
    {
        path: 'adduser',
        component: UserFormComponent
    }
];