import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

export interface LoanCreateResponse {
  message: string;
  dueDate?: string;
}

export interface LoanActiveCheckResponse {
  hasActive: boolean;
  dueDate?: string;
}

@Injectable({ providedIn: 'root' })
export class LoansService {
  private http = inject(HttpClient);
  private base = (environment.apiBase?.replace(/\/+$/, '') || '');

  /** Crée un emprunt pour l'utilisateur courant (identifié par le JWT). */
  createLoanForCurrentUser(bookId: number): Observable<LoanCreateResponse> {
    const headers = this.authHeader();
    const url = `${this.base}/api/v1/loans`;

    // On envoie userId si on arrive à le lire, sinon le backend le prendra depuis le JWT
    const maybeUserId = this.extractUserId(this.pickToken());
    const body: any = { bookId };
    if (maybeUserId) body.userId = maybeUserId;

    return this.http.post<LoanCreateResponse>(url, body, { headers });
  }

  /** Indique si l'utilisateur courant a déjà un prêt actif pour ce livre. */
  hasActiveForCurrentUser(bookId: number): Observable<LoanActiveCheckResponse> {
    const headers = this.authHeader();
    const url = `${this.base}/api/v1/loans/active/me/${bookId}`;
    return this.http.get<LoanActiveCheckResponse>(url, { headers });
  }

  // ---- helpers JWT ----
  private authHeader(): HttpHeaders | undefined {
    const token = this.pickToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  private pickToken(): string | null {
    return (
      sessionStorage.getItem('token') ?? localStorage.getItem('token') ??
      sessionStorage.getItem('access_token') ?? localStorage.getItem('access_token')
    );
  }

  /** Lecture robuste de l'ID utilisateur dans différents claims possibles. */
  private extractUserId(token: string | null): number | null {
    if (!token) return null;
    try {
      const p = this.decodeJwt(token);
      const candidates = [
        p.userId, p.userid, p.UserId, p.uid, p.sub, p.nameid,
        p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
        p['http://schemas.microsoft.com/identity/claims/objectidentifier'] // au cas où (Azure AD)
      ];
      const v = candidates.find(x => x !== undefined && x !== null);
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch { return null; }
  }

  private decodeJwt(token: string): any {
    const base64 = token.split('.')[1] || '';
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(json);
  }
}

