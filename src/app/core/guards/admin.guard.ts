import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Admin Guard
 * ========================================
 * Protège les routes admin en vérifiant que l'utilisateur
 * connecté a le rôle "Admin"
 */
export const AdminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Vérifier si l'utilisateur est authentifié
  if (!authService.isAuthenticated()) {
    router.navigate(['/connexion'], {
      queryParams: { returnUrl: router.url }
    });
    return false;
  }

  // Vérifier si l'utilisateur a le rôle Admin
  const role = authService.getRole();

  if (role === 'Admin') {
    return true;
  }

  // Si pas admin, rediriger vers l'accueil
  router.navigate(['/']);
  return false;
};