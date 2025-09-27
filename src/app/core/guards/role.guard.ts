import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Role-based guard for route protection.
 * ------------------------
 * Checks if the user is authenticated and has one of the allowed roles
 * before granting access to a route. If not, redirects to the login page.
 *
 * @param roles - Array of allowed roles ('User', 'Librarian', 'Admin')
 * @returns CanActivateFn function usable in route definitions
 */
export function roleGuard(roles: Array<'User' | 'Librarian' | 'Admin'>): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.getRole();

    // Block access if user is not authenticated or role is not allowed
    if (!auth.isAuthenticated() || !role || !roles.includes(role)) {
      router.navigate(['/connexion']);
      return false;
    }

    return true; // Access granted
  };
}
