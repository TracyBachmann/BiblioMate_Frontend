import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/pages/home-page/home-page.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'connexion', component: LoginComponent },
  { path: 'inscription', component: RegisterComponent },

  { path: 'confirm-email', loadComponent: () => import('./features/auth/confirm-email.component') },
  { path: 'mot-de-passe-oublie', loadComponent: () => import('./features/auth/forgot-password.component') },
  { path: 'reinitialiser-mot-de-passe', loadComponent: () => import('./features/auth/reset-password.component') },

  { path: '**', redirectTo: '' }
];
