import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environment';

export type ReservationStatus = 'Pending' | 'Available' | 'Completed' | 'Cancelled';

export interface ReservationRead {
  reservationId: number;
  userId: number;
  userName?: string;
  bookId: number;
  bookTitle?: string;
  reservationDate: string;
  status: ReservationStatus;
}

@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private http = inject(HttpClient);
  private base = (environment.apiBase ?? '').replace(/\/+$/, '');

  /** POST /api/reservations for the current user */
  createForCurrentUser(bookId: number): Observable<ReservationRead> {
    const token = this.pickToken();
    const userId = this.extractUserId(token);
    if (!userId) return throwError(() => ({ status: 401, error: { error: 'Not authenticated' } }));

    const url = `${this.base}/api/reservations`;
    const body = { userId, bookId };
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post<ReservationRead>(url, body, { headers });
  }

  /** Does the current user already have a (pending/available) reservation for this book? */
  hasForCurrentUser(bookId: number): Observable<boolean> {
    const token = this.pickToken();
    const userId = this.extractUserId(token);
    if (!userId) return of(false);

    const url = `${this.base}/api/reservations/user/${userId}`;
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.get<ReservationRead[]>(url, { headers }).pipe(
      map(list =>
        Array.isArray(list) &&
        list.some(r => r.bookId === bookId && (r.status === 'Pending' || r.status === 'Available'))
      ),
      catchError(() => of(false))
    );
  }

  // --- helpers (same pattern as LoansService) ---
  private pickToken(): string | null {
    return (
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token')
    );
  }
  private extractUserId(token: string | null): number | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const raw =
        payload.userId ??
        payload.userid ??
        payload.UserId ??
        payload.nameid ??
        payload.sub ??
        payload.uid;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  }
}
