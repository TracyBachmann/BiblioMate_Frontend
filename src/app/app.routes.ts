/**
 * Application main route configuration.
 *
 * This file defines all routes of the Angular application, including:
 * - Public routes (home, login, register, catalog, info pages).
 * - Auth-related routes (email confirmation, password reset, register success).
 * - Protected routes under "personal space" (`/espace`) guarded by `authGuard`.
 * - Lazy-loaded components for performance optimization.
 * - Fallback route redirecting to home (`''`).
 *
 * Each route entry maps a URL path to a component, or uses `loadComponent`
 * for lazy loading. Child routes are used for account-related features.
 */

import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/pages/home-page/home-page.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import ConfirmEmailComponent from './features/auth/confirm-email.component';
import ForgotPasswordComponent from './features/auth/forgot-password.component';
import ResetPasswordComponent from './features/auth/reset-password.component';
import { CatalogPageComponent } from './features/catalog/pages/catalog-page/catalog-page.component';
import { BookDetailsPageComponent } from './features/catalog/pages/book-details-page/book-details-page.component';
import { PersonalSpaceComponent } from './features/account/pages/personal-space/personal-space.component';
import RegisterSuccessComponent from './features/auth/register-success.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  /** Home route - default landing page */
  { path: '', component: HomePageComponent },

  /** Authentication routes */
  { path: 'connexion', component: LoginComponent }, // Login page
  { path: 'inscription', component: RegisterComponent }, // Register page
  { path: 'confirm-email', component: ConfirmEmailComponent }, // Email confirmation
  { path: 'mot-de-passe-oublie', component: ForgotPasswordComponent }, // Forgot password
  { path: 'reinitialiser-mot-de-passe', component: ResetPasswordComponent }, // Reset password
  { path: 'inscription/verification', component: RegisterSuccessComponent }, // Register success

  /** Catalog routes */
  { path: 'catalogue', component: CatalogPageComponent }, // Catalog listing
  {
    path: 'livre/:id',
    // Lazy-loaded book details by ID
    loadComponent: () =>
      import('./features/catalog/pages/book-details-page/book-details-page.component')
        .then(m => m.BookDetailsPageComponent)
  },

  /** Personal account space (protected by authGuard) */
  {
    path: 'espace',
    canActivate: [authGuard],
    children: [
      { path: '', component: PersonalSpaceComponent }, // Default personal space page
      {
        path: 'profil',
        // Lazy-loaded user profile page
        loadComponent: () =>
          import('./features/account/pages/user-profile/user-profile.component')
            .then(m => m.UserProfileComponent)
      },
      {
        path: 'mes-reservations',
        // Lazy-loaded reservations management page
        loadComponent: () =>
          import('./features/account/pages/my-reservations/my-reservations.component')
            .then(m => m.MyReservationsComponent)
      },
      {
        path: 'mes-emprunts',
        // Lazy-loaded loans management page
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

  /** Wildcard route - redirects any unknown URL to home */
  { path: '**', redirectTo: '' }
];
