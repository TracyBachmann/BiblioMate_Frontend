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
export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'connexion', component: LoginComponent },
  { path: 'inscription', component: RegisterComponent },

  { path: 'confirm-email', component: ConfirmEmailComponent },
  { path: 'mot-de-passe-oublie', component: ForgotPasswordComponent },
  { path: 'reinitialiser-mot-de-passe', component: ResetPasswordComponent },

  { path: 'catalogue', component: CatalogPageComponent },
  { path: 'books/:id', component: BookDetailsPageComponent },

  { path: 'espace', component: PersonalSpaceComponent },

  { path: 'contact', loadComponent: () => import('./features/info/pages/contact-page/contact-page.component').then(m => m.ContactPageComponent) },
  { path: 'a-propos', loadComponent: () => import('./features/info/pages/about-page/about-page.component').then(m => m.AboutPageComponent) },
  { path: 'faq', loadComponent: () => import('./features/info/pages/faq-page/faq-page.component').then(m => m.FaqPageComponent) },
  { path: 'mentions-legales', loadComponent: () => import('./features/info/pages/legal-notice-page/legal-notice-page.component').then(m => m.LegalNoticePageComponent) },

  { path: '**', redirectTo: '' }
];
