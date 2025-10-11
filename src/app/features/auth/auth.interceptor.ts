import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();

    // Normalize the API base URL (remove trailing slashes)
    const apiBase = environment.apiBase.replace(/\/+$/, '');
    const isApi = req.url.toLowerCase().startsWith(apiBase.toLowerCase());

    // If the token exists but is expired, log out immediately and cancel the request
    if (token && this.auth.isTokenExpired(token)) {
      console.warn('Expired token, logging out');
      this.auth.logout();
      return EMPTY;
    }

    // Detect authentication endpoints that must not include the Authorization header
    let isAuthEndpoint = false;
    if (isApi) {
      const path = req.url.substring(apiBase.length).toLowerCase();
      isAuthEndpoint =
        path.startsWith('/api/auths/login') ||
        path.startsWith('/api/auths/register') ||
        path.startsWith('/api/auths/resend-confirmation') ||
        path.startsWith('/api/auths/confirm-email') ||
        path.startsWith('/api/auths/request-password-reset') ||
        path.startsWith('/api/auths/reset-password');
    }

    // Debug log (can be removed in production)
    console.log('Interceptor', {
      url: req.url,
      apiBase,
      tokenPresent: !!token,
      isApi,
      isAuthEndpoint
    });

    // Clone the request and add the Bearer token if applicable
    const authReq =
      token && isApi && !isAuthEndpoint
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    // Forward the request and handle HTTP errors
    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !isAuthEndpoint) {
          console.warn('401 Unauthorized detected, logging out');
          this.auth.logout();
          return EMPTY;
        }
        if (err.status === 403) {
          console.warn('403 Forbidden access');
        }
        return throwError(() => err);
      })
    );
  }
}
