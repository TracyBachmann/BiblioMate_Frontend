/**
 * Application main route configuration.
 *
 * - Public routes (home, login, register, catalog, info pages).
 * - Auth routes (email confirmation, password reset, register success).
 * - Protected personal space under /espace (authGuard).
 * - Admin/Management pages under /management/* (authGuard).
 */

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  /** Home route - default landing page (lazy loaded) */
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page.component')
        .then(m => m.HomePageComponent)
  },

  /** Authentication routes */
  {
    path: 'connexion',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'inscription',
    loadComponent: () =>
      import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'confirm-email',
    loadComponent: () =>
      import('./features/auth/confirm-email.component').then(m => m.default)
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () =>
      import('./features/auth/forgot-password.component').then(m => m.default)
  },
  {
    path: 'reinitialiser-mot-de-passe',
    loadComponent: () =>
      import('./features/auth/reset-password.component').then(m => m.default)
  },
  {
    path: 'inscription/verification',
    loadComponent: () =>
      import('./features/auth/register-success.component').then(m => m.default)
  },

  /** Catalog routes */
  {
    path: 'catalogue',
    loadComponent: () =>
      import('./features/catalog/pages/catalog-page/catalog-page.component')
        .then(m => m.CatalogPageComponent)
  },
  {
    path: 'livre/:id',
    loadComponent: () =>
      import('./features/catalog/pages/book-details-page/book-details-page.component')
        .then(m => m.BookDetailsPageComponent)
  },

  /** Personal account space (protected) */
  {
    path: 'espace',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/account/pages/personal-space/personal-space.component')
        .then(m => m.PersonalSpaceComponent),
    children: [
      {
        path: 'profil',
        loadComponent: () =>
          import('./features/account/pages/user-profile/user-profile.component')
            .then(m => m.UserProfileComponent)
      },
      {
        path: 'mes-reservations',
        loadComponent: () =>
          import('./features/account/pages/my-reservations/my-reservations.component')
            .then(m => m.MyReservationsComponent)
      },
      {
        path: 'mes-emprunts',
        loadComponent: () =>
          import('./features/account/pages/my-loans/my-loans.component')
            .then(m => m.MyLoansComponent)
      }
    ]
  },

  /** Catalog management (for admins or privileged users) */
  {
    path: 'catalogue/ajout-livre',
    loadComponent: () =>
      import('./features/catalog/pages/book-creation/book-creation.component')
        .then(m => m.BookCreationComponent)
  },
  {
    path: 'catalogue/gestion',
    loadComponent: () =>
      import('./features/catalog/pages/catalog-management/catalog-management.component')
        .then(m => m.CatalogManagementComponent)
  },

  /** Management area (admin) — protected */
  {
    path: 'management/admin/logs-reports',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/logs-reports/logs-reports.component')
        .then(m => m.LogsReportsComponent)
  },
  {
    path: 'management/admin/user-management',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/user-management/user-management.component')
        .then(m => m.UserManagementComponent)
  },
  {
    path: 'management/admin/business-settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/business-settings/business-settings.component')
        .then(m => m.BusinessSettingsComponent)
  },
  {
    path: 'management/reference-data',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/management/reference-data/reference-data.component')
        .then(m => m.ReferenceDataComponent)
  },

  /** Informational pages */
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/info/pages/contact-page/contact-page.component')
        .then(m => m.ContactPageComponent)
  },
  {
    path: 'a-propos',
    loadComponent: () =>
      import('./features/info/pages/about-page/about-page.component')
        .then(m => m.AboutPageComponent)
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./features/info/pages/faq-page/faq-page.component')
        .then(m => m.FaqPageComponent)
  },
  {
    path: 'mentions-legales',
    loadComponent: () =>
      import('./features/info/pages/legal-notice-page/legal-notice-page.component')
        .then(m => m.LegalNoticePageComponent)
  },

  /** Fallback */
  { path: '**', redirectTo: '' }
];
