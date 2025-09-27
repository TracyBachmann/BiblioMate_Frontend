import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Auth guard for route protection.
 * ------------------------
 * Ensures that the user is authenticated and the token is valid before
 * allowing access to a route. If the user is not authenticated or the token
 * has expired, they are redirected to the login page with a return URL.
 */
export const authGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If user is not authenticated or token is expired
  if (!auth.isAuthenticated() || auth.isTokenExpired()) {
    // Redirect to login page with return URL
    router.navigate(['/connexion'], { queryParams: { returnUrl: state.url } });
    return false; // Block access
  }

  return true; // Allow access
};
