import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'offers',
    loadComponent: () => import('./features/offers/offers.page').then((m) => m.OffersPage),
  },
  {
    path: 'offers/:id',
    loadComponent: () =>
      import('./features/offers/offer-detail.page').then((m) => m.OfferDetailPage),
  },
  {
    path: 'applications',
    loadComponent: () =>
      import('./features/applications/applications.page').then((m) => m.ApplicationsPage),
  },
  {
    path: 'account',
    loadComponent: () => import('./features/register/register.page').then((m) => m.RegisterPage),
  },
  { path: '', pathMatch: 'full', redirectTo: 'offers' },
  { path: '**', redirectTo: 'offers' },
];
