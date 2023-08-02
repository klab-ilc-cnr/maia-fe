import { LanguagesListComponent } from "../pages/lexicon/languages-list/languages-list.component";
import { LanguagesViewComponent } from "../pages/lexicon/languages-view/languages-view.component";
import { NamespacesListComponent } from "../pages/lexicon/namespaces-list/namespaces-list.component";

export const LEXICON_ROUTES = [
  {
    path: 'languages',
    loadChildren: () => import('../modules/languages-management.module').then(m => m.LanguagesManagementModule),
  },
  {
    path: 'namespaces',
    loadChildren: () => import('../modules/namespaces.module').then(m => m.NamespacesModule),
  },
];

export const LANGUAGES_MANAGEMENT_ROUTES = [
  {
    path: '',
    component: LanguagesListComponent
  },
  {
    path: ':id',
    component: LanguagesViewComponent
  }

];
export const NAMESPACES_ROUTES = [
  {
    path: '',
    component: NamespacesListComponent,
  },
];
