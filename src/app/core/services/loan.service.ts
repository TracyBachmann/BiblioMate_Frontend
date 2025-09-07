import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environment';

export interface LoanCreateResponse { message: string; dueDate?: string; }

@Injectable({ providedIn: 'root' })
export class LoansService {
  private http = inject(HttpClient);
  private base = environment.apiBase?.replace(/\/+$/, '') || '';

  createLoanForCurrentUser(bookId: number): Observable<LoanCreateResponse> {
    const token = this.pickToken();
    const userId = this.extractUserId(token);
    if (!userId) return throwError(() => ({ status: 401, error: { error: 'Not authenticated' }}));

    const url = `${this.base}/api/loans`;
    const body = { userId, bookId };
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<LoanCreateResponse>(url, body, { headers });
  }

  private pickToken(): string | null {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
      || localStorage.getItem('token')        || sessionStorage.getItem('token');
  }
  private extractUserId(token: string | null): number | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const raw = payload.userId ?? payload.userid ?? payload.UserId ?? payload.nameid ?? payload.sub ?? payload.uid;
      const n = Number(raw); return Number.isFinite(n) && n>0 ? n : null;
    } catch { return null; }
  }
}
