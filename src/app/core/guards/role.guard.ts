import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export function roleGuard(roles: Array<'User' | 'Librarian' | 'Admin'>): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.getRole();

    if (!auth.isAuthenticated() || !role || !roles.includes(role)) {
      router.navigate(['/connexion']);
      return false;
    }
    return true;
  };
}