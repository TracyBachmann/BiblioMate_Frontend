import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export function roleGuard(roles: ('User' | 'Librarian' | 'Admin')[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated?.()) {
      router.navigate(['/connexion']);
      return false;
    }

    const raw = auth.getRole?.();
    const role = raw
      ? (String(raw).toLowerCase() === 'admin'
        ? 'Admin'
        : String(raw).toLowerCase() === 'librarian'
          ? 'Librarian'
          : 'User')
      : undefined;

    if (!role) {
      router.navigate(['/connexion']);
      return false;
    }

    // Règle d'héritage: Admin -> Librarian uniquement
    // - Si la route autorise 'Admin' → OK
    // - Sinon, si la route autorise 'Librarian' et l'utilisateur est 'Admin' → OK (héritage)
    // - Sinon, aucun héritage vers 'User' → Admin NE PASSE PAS sur des routes 'User' only
    if (role === 'Admin') {
      if (roles.includes('Admin')) { return true; }
      if (roles.includes('Librarian')) { return true; }
      router.navigate(['/connexion']);
      return false;
    }

    if (!roles.includes(role)) {
      router.navigate(['/connexion']);
      return false;
    }

    return true;
  };
}
