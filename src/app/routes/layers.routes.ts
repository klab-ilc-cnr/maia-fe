import { LayersViewComponent } from '../pages/layers/layers-view/layers-view.component';
import { LayersListComponent } from './../pages/layers/layers-list/layers-list.component';

/**Route relative alla gestione dei layer */
export const LAYERS_ROUTES = [
    {
        path: '',
        component: LayersListComponent,
    },
    {
        path: ':id',
        component: LayersViewComponent,
    }
];
