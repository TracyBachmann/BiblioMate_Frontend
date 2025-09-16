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
  { path: '', component: HomePageComponent },
  { path: 'connexion', component: LoginComponent },
  { path: 'inscription', component: RegisterComponent },

  { path: 'confirm-email', component: ConfirmEmailComponent },
  { path: 'mot-de-passe-oublie', component: ForgotPasswordComponent },
  { path: 'reinitialiser-mot-de-passe', component: ResetPasswordComponent },
  { path: 'inscription/verification', component: RegisterSuccessComponent },

  { path: 'catalogue', component: CatalogPageComponent },
  {
    path: 'livre/:id',
    loadComponent: () =>
      import('./features/catalog/pages/book-details-page/book-details-page.component')
        .then(m => m.BookDetailsPageComponent)
  },

  {
    path: 'espace',
    canActivate: [authGuard],
    children: [
      { path: '', component: PersonalSpaceComponent },
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
      },
      {
        path: 'gestion-emprunts-reservations',
        loadComponent: () =>
          import('./features//management/loans-reservation-management/loans-reservation-management.component')
            .then(m => m.LoansReservationManagementComponent)
      }
    ]
  },

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

  { path: 'contact', loadComponent: () => import('./features/info/pages/contact-page/contact-page.component').then(m => m.ContactPageComponent) },
  { path: 'a-propos', loadComponent: () => import('./features/info/pages/about-page/about-page.component').then(m => m.AboutPageComponent) },
  { path: 'faq', loadComponent: () => import('./features/info/pages/faq-page/faq-page.component').then(m => m.FaqPageComponent) },
  { path: 'mentions-legales', loadComponent: () => import('./features/info/pages/legal-notice-page/legal-notice-page.component').then(m => m.LegalNoticePageComponent) },

  { path: '**', redirectTo: '' }
];