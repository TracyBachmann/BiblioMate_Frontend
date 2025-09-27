import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

/** Response when creating a loan */
export interface LoanCreateResponse {
  message: string;
  dueDate?: string;
}

/** Response for checking if a user has an active loan for a book */
export interface LoanActiveCheckResponse {
  hasActive: boolean;
  dueDate?: string;
}

/** Row returned by GET /api/v1/loans/active/me */
export interface LoanRow {
  loanId: number;
  bookId: number;
  bookTitle?: string | null;
  coverUrl?: string | null;
  description?: string | null;
  loanDate: string;       // ISO string
  dueDate?: string | null; // ISO string
}

/**
 * Service to interact with the loans API.
 * --------------------------------------
 * Provides methods for:
 *  - Creating a loan for the current user
 *  - Checking if the user has an active loan
 *  - Listing all active loans of the current user
 *  - Extending a loan
 *
 * Internally handles JWT extraction to identify the user.
 */
@Injectable({ providedIn: 'root' })
export class LoansService {
  private http = inject(HttpClient);
  private base = (environment.apiBase?.replace(/\/+$/, '') || '');

  // ====== Loans for the current user from book detail ======

  /** Create a loan for the current user for a given book */
  createLoanForCurrentUser(bookId: number): Observable<LoanCreateResponse> {
    const headers = this.authHeader();
    const url = `${this.base}/api/v1/loans`;

    // Include userId if readable from token; otherwise backend uses JWT
    const maybeUserId = this.extractUserId(this.pickToken());
    const body: any = { bookId };
    if (maybeUserId) body.userId = maybeUserId;

    return this.http.post<LoanCreateResponse>(url, body, { headers });
  }

  /** Check if the current user has an active loan for a specific book */
  hasActiveForCurrentUser(bookId: number): Observable<LoanActiveCheckResponse> {
    const headers = this.authHeader();
    const url = `${this.base}/api/v1/loans/active/me/${bookId}`;
    return this.http.get<LoanActiveCheckResponse>(url, { headers });
  }

  // ====== My active loans ======

  /** Get the list of active loans for the current user */
  getMyActive(): Observable<LoanRow[]> {
    const headers = this.authHeader();
    const url = `${this.base}/api/v1/loans/active/me`;
    return this.http.get<LoanRow[]>(url, { headers });
  }

  /** Extend an active loan */
  extendLoan(loanId: number): Observable<{ dueDate: string }> {
    const headers = this.authHeader();
    const url = `${this.base}/api/v1/loans/${loanId}/extend`;
    return this.http.post<{ dueDate: string }>(url, {}, { headers });
  }

  // ====== JWT helpers ======

  /** Build Authorization header if a token exists */
  private authHeader(): HttpHeaders | undefined {
    const token = this.pickToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  /** Pick the JWT token from session or local storage (supports both keys) */
  private pickToken(): string | null {
    return (
      sessionStorage.getItem('token') ?? localStorage.getItem('token') ??
      sessionStorage.getItem('access_token') ?? localStorage.getItem('access_token')
    );
  }

  /** Robustly extract the user ID from different JWT claims */
  private extractUserId(token: string | null): number | null {
    if (!token) return null;
    try {
      const p = this.decodeJwt(token);
      const candidates = [
        p.userId, p.userid, p.UserId, p.uid, p.sub, p.nameid,
        p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        p['http://schemas.microsoft.com/identity/claims/objectidentifier']
      ];
      const v = candidates.find(x => x !== undefined && x !== null);
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch { return null; }
  }

  /** Decode a JWT without verifying signature to read claims */
  private decodeJwt(token: string): any {
    const base64 = token.split('.')[1] || '';
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  }
}