import { USERSMANAGEMENT_ROUTES } from "../model/usersmanagement.routes";

export const PROJECTX_ROUTES = [
    {
        path: 'usersManagement',
        children: USERSMANAGEMENT_ROUTES
    }
];