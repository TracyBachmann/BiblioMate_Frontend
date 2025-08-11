import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, map } from 'rxjs';

export type UserRole = 'User' | 'Librarian' | 'Admin' | null;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly REMEMBER_KEY = 'remember';

  private _token$ = new BehaviorSubject<string | null>(this.readToken());
  readonly token$ = this._token$.asObservable();
  readonly isAuthenticated$ = this.token$.pipe(map(t => !!t));
  readonly role$ = this.token$.pipe(map(t => this.readRole(t)));

  private logoutTimer: any;

  constructor(private router: Router) {
    // si un token est déjà présent au chargement, on programme l’auto-logout
    const t = this.readToken();
    if (t) this.scheduleAutoLogout(t);
  }

  // ---- état & lecture
  isAuthenticated(): boolean { return !!this.readToken(); }
  getToken(): string | null { return this.readToken(); }
  getRole(): UserRole { return this.readRole(this.readToken()); }

  // ---- login / logout
  login(token: string, remember = false): void {
    // stockage selon "remember me"
    sessionStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_KEY);

    if (remember) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.REMEMBER_KEY, '1');
    } else {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      localStorage.removeItem(this.REMEMBER_KEY);
    }

    this._token$.next(token);
    this.scheduleAutoLogout(token);
  }

  logout(): void {
    clearTimeout(this.logoutTimer);
    sessionStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REMEMBER_KEY);
    this._token$.next(null);
    this.router.navigate(['/connexion']);
  }

  // ---- expiration / auto-logout
  scheduleAutoLogout(token: string) {
    clearTimeout(this.logoutTimer);
    const expMs = this.expiryFrom(token);
    if (!expMs) return;
    const delay = Math.max(expMs - Date.now(), 0);
    this.logoutTimer = setTimeout(() => this.logout(), delay);
  }

  isTokenExpired(token?: string | null): boolean {
    const t = token ?? this.readToken();
    if (!t) return true;
    const expMs = this.expiryFrom(t);
    if (!expMs) return true;
    return Date.now() >= expMs;
  }

  private expiryFrom(token: string): number | null {
    try {
      const payload = this.decodeJwt(token);
      // exp (seconds) -> ms
      return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  // ---- helpers
  private readToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY) ?? localStorage.getItem(this.TOKEN_KEY);
  }

  private readRole(token: string | null): UserRole {
    if (!token) return null;
    try {
      const p = this.decodeJwt(token);
      return (p['role']
        ?? p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
        ?? null) as UserRole;
    } catch { return null; }
  }

  private decodeJwt(token: string): any {
    const base64 = token.split('.')[1];
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  }
}
