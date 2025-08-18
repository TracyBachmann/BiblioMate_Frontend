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
import { environment } from '../../../environment'; // <- correct path for your project

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();

    // Skip auth endpoints entirely
    const EXCLUDE = /\/api\/auths\/(login|register|confirm-email|request-password-reset|reset-password)\b/i;
    const isApiCall = req.url.startsWith(environment.apiBase);
    const isExcluded = EXCLUDE.test(req.url);

    if (token && this.auth.isTokenExpired(token)) {
      this.auth.logout();
      return EMPTY;
    }

    const needsAuthHeader = token && isApiCall && !isExcluded;
    const authReq = needsAuthHeader
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.auth.logout();
        } else if (err.status === 403) {
          console.warn('Accès refusé (403).');
        }
        return throwError(() => err);
      })
    );
  }
}
