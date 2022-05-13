import { USERSMANAGEMENT_ROUTES } from "./usersmanagement.routes";
import { WORKSPACES_ROUTES } from "./workspaces.routes";

export const PROJECTX_ROUTES = [
    {
        path: 'usersManagement',
        children: USERSMANAGEMENT_ROUTES
    },
    {
        path: 'workspace',
        children: WORKSPACES_ROUTES
    }
];