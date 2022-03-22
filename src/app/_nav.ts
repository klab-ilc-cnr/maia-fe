import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'User Management',
    url: '/',
    icon: 'icon-puzzle',
    children: [
      {
        name: 'PersonalData',
        url: '/base/cards',
        icon: 'icon-puzzle'
      },
      {
        name: 'Carousels',
        url: '/base/carousels',
        icon: 'icon-puzzle'
      }
    ]
  }
];
