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

    // Token présent mais expiré => on coupe net la requête
    if (token && this.auth.isTokenExpired(token)) {
      this.auth.logout();
      return EMPTY;
    }

    // On ne touche qu’aux appels vers notre backend
    const isApi = req.url.startsWith(environment.apiBase);

    // Détermine si l’URL est un endpoint d’auth à exclure
    let isAuthEndpoint = false;
    if (isApi) {
      // ex: /api/auths/login
      const path = req.url.substring(environment.apiBase.length).toLowerCase();

      isAuthEndpoint =
        path.startsWith('/api/auths/login') ||
        path.startsWith('/api/auths/register') ||
        path.startsWith('/api/auths/resend-confirmation') ||
        path.startsWith('/api/auths/confirm-email') ||
        path.startsWith('/api/auths/request-password-reset') ||
        path.startsWith('/api/auths/reset-password');
    }

    // Ajoute le Bearer uniquement si nécessaire
    const authReq =
      token && isApi && !isAuthEndpoint
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.auth.logout();
          return EMPTY;
        }
        if (err.status === 403) {
          console.warn('Accès refusé (403).');
        }
        return throwError(() => err);
      })
    );
  }
}
