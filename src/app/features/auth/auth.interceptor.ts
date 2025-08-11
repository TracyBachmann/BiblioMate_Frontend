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

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();

    // Si token présent mais expiré -> logout immédiat et on annule la requête
    if (token && this.auth.isTokenExpired(token)) {
      this.auth.logout();
      return EMPTY;
    }

    // Ajout de l’en-tête Authorization si token présent
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          // session invalide/expirée -> on déconnecte
          this.auth.logout();
        } else if (err.status === 403) {
          // droits insuffisants
          console.warn('Accès refusé (droits insuffisants).');
          // ici tu peux afficher un toast si tu as un service de notifications
        }
        return throwError(() => err);
      })
    );
  }
}
