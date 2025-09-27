import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

/**
 * Defines the possible user roles.
 */
export type UserRole = 'User' | 'Librarian' | 'Admin' | null;

/**
 * AuthService
 * ------------------------
 * Central service to manage authentication and user session.
 * Handles:
 *  - Token storage and retrieval (localStorage/sessionStorage)
 *  - Observable streams for token, authentication state, role, and display name
 *  - Automatic logout based on token expiration
 *  - Synchronous getters for token, role, and user names
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Token keys for backward compatibility
  private readonly TOKEN_KEYS = ['token', 'access_token'] as const;
  private readonly REMEMBER_KEY = 'remember';

  // Observable token stream
  private _token$ = new BehaviorSubject<string | null>(this.readToken());
  readonly token$: Observable<string | null> = this._token$.asObservable();

  // Observable boolean indicating authentication state
  readonly isAuthenticated$ = this.token$.pipe(
    map(t => !!t && !this.isTokenExpired(t))
  );

  // Observable user role
  readonly role$ = this.token$.pipe(map(t => this.readRole(t)));

  // Observable first name / last name / display name
  readonly firstName$ = this.token$.pipe(map(t => this.readFirstName(t)));
  readonly lastName$  = this.token$.pipe(map(t => this.readLastName(t)));
  readonly displayName$ = combineLatest([this.firstName$, this.lastName$, this.token$]).pipe(
    map(([f, l, t]) => {
      const n = this.readName(t);
      if (typeof n === 'string' && n.trim()) return n.trim();
      const parts = [f ?? '', l ?? ''].map(s => s.trim()).filter(Boolean);
      return parts.length ? parts.join(' ') : null;
    })
  );

  private logoutTimer: any;

  constructor(private router: Router) {
    // Initialize token and schedule auto-logout if applicable
    const t = this.readToken();
    this._token$.next(t);
    if (t) this.scheduleAutoLogout(t);
  }

  // -------- Synchronous state access --------

  /**
   * Synchronous check if the user is authenticated.
   * Updates observable state if needed.
   */
  isAuthenticated(): boolean {
    const t = this.readToken();
    const ok = !!t && !this.isTokenExpired(t);
    if (ok !== !!this._token$.value) this._token$.next(t);
    return ok;
  }

  /** Returns the current token synchronously */
  getToken(): string | null { return this.readToken(); }

  /** Returns the current user role synchronously */
  getRole(): UserRole { return this.readRole(this.readToken()); }

  /** Returns the user's first name synchronously */
  getFirstName(): string | null { return this.readFirstName(this.readToken()); }

  /** Returns the user's last name synchronously */
  getLastName():  string | null { return this.readLastName(this.readToken()); }

  /** Returns the user's display name synchronously */
  getDisplayName(): string | null {
    const t = this.readToken();
    const direct = this.readName(t);
    if (direct && direct.trim()) return direct.trim();
    const f = this.readFirstName(t), l = this.readLastName(t);
    const parts = [f ?? '', l ?? ''].map(s => s.trim()).filter(Boolean);
    return parts.length ? parts.join(' ') : null;
  }

  /**
   * Refresh token state from storage if another code modified it.
   */
  refreshFromStorage(): void {
    const t = this.readToken();
    if (t !== this._token$.value) {
      this._token$.next(t);
      if (t) this.scheduleAutoLogout(t);
    }
  }

  // -------- Login / Logout --------

  /**
   * Logs in the user by storing the token and scheduling auto-logout.
   * @param token JWT token
   * @param remember whether to store in localStorage (persistent) or sessionStorage
   */
  login(token: string, remember = false): void {
    this.clearToken();

    // Write token to storage (both keys for backward compatibility)
    if (remember) {
      for (const k of this.TOKEN_KEYS) localStorage.setItem(k, token);
      localStorage.setItem(this.REMEMBER_KEY, '1');
    } else {
      for (const k of this.TOKEN_KEYS) sessionStorage.setItem(k, token);
      localStorage.removeItem(this.REMEMBER_KEY);
    }

    this._token$.next(token);
    this.scheduleAutoLogout(token);
  }

  /** Logs out the user and navigates to the login page */
  logout(): void {
    clearTimeout(this.logoutTimer);
    this.clearToken();
    this._token$.next(null);
    this.router.navigate(['/connexion']);
  }

  // -------- Token expiration and auto-logout --------

  /**
   * Schedule automatic logout based on JWT expiration.
   * Does nothing if token has no expiration.
   */
  scheduleAutoLogout(token: string) {
    clearTimeout(this.logoutTimer);
    const expMs = this.expiryFrom(token);
    if (!expMs) return;
    const delay = Math.max(expMs - Date.now(), 0);
    if (delay === 0) {
      // Token already expired, keep observable updated
      this._token$.next(token);
      return;
    }
    this.logoutTimer = setTimeout(() => this.logout(), delay);
  }

  /** Checks whether the token is expired */
  isTokenExpired(token?: string | null): boolean {
    const t = token ?? this.readToken();
    if (!t) return true;
    const expMs = this.expiryFrom(t);
    if (!expMs) return false; // token has no exp claim → considered valid
    return Date.now() >= expMs;
  }

  /** Extract expiration time (ms) from JWT payload */
  private expiryFrom(token: string): number | null {
    try {
      const payload = this.decodeJwt(token);
      return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  // -------- Helpers to read token claims --------

  /** Reads token from sessionStorage first, then localStorage */
  private readToken(): string | null {
    for (const k of this.TOKEN_KEYS) {
      const s = sessionStorage.getItem(k);
      if (s) return s;
    }
    for (const k of this.TOKEN_KEYS) {
      const l = localStorage.getItem(k);
      if (l) return l;
    }
    return null;
  }

  /** Reads role claim from token */
  private readRole(token: string | null): UserRole {
    if (!token) return null;
    try {
      const p = this.decodeJwt(token);
      return (p['role']
        ?? p['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
        ?? null) as UserRole;
    } catch { return null; }
  }

  /** Reads display name claim from token */
  private readName(token: string | null): string | null {
    if (!token) return null;
    try {
      const p = this.decodeJwt(token);
      const v =
        p['name'] ??
        p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
        null;
      return (typeof v === 'string' && v.trim()) ? v : null;
    } catch { return null; }
  }

  /** Reads first name claim from token */
  private readFirstName(token: string | null): string | null {
    if (!token) return null;
    try {
      const p = this.decodeJwt(token);
      const v =
        p['given_name'] ??
        p['firstName'] ??
        p['firstname'] ??
        p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ??
        null;
      return (typeof v === 'string' && v.trim()) ? v.trim() : null;
    } catch { return null; }
  }

  /** Reads last name claim from token */
  private readLastName(token: string | null): string | null {
    if (!token) return null;
    try {
      const p = this.decodeJwt(token);
      const v =
        p['family_name'] ??
        p['lastName'] ??
        p['lastname'] ??
        p['surname'] ??
        p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] ??
        null;
      return (typeof v === 'string' && v.trim()) ? v.trim() : null;
    } catch { return null; }
  }

  /** Decodes JWT payload without verifying signature */
  private decodeJwt(token: string): any {
    const part = token.split('.')[1] || '';
    let norm = part.replace(/-/g, '+').replace(/_/g, '/');
    while (norm.length % 4) norm += '=';
    const json = decodeURIComponent(
      atob(norm).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  }

  /** Clears token from all storage locations */
  private clearToken(): void {
    for (const k of this.TOKEN_KEYS) {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    }
    localStorage.removeItem(this.REMEMBER_KEY);
  }
}
