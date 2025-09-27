import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environment';

/** Possible statuses for a reservation */
export type ReservationStatus = 'Pending' | 'Available' | 'Completed' | 'Cancelled';

/** DTO representing a reservation returned from the backend */
export interface ReservationRead {
  reservationId: number;
  userId: number;
  userName?: string;
  bookId: number;
  bookTitle?: string;

  // Optional properties if backend provides them
  coverUrl?: string | null;
  description?: string | null;
  expirationDate?: string | null;

  reservationDate: string;
  status: ReservationStatus;
}

/**
 * Service to interact with the reservations API
 * ---------------------------------------------------
 * Provides methods for:
 *  - Getting all active reservations for the current user
 *  - Checking if the user has an active reservation for a specific book
 *  - Creating a reservation for the current user
 *
 * Internally handles JWT extraction to identify the user.
 */
@Injectable({ providedIn: 'root' })
export class ReservationsService {
  private http = inject(HttpClient);
  private base = (environment.apiBase ?? '').replace(/\/+$/, '');

  /** GET all active reservations (Pending/Available) for the current user */
  getForCurrentUser(): Observable<ReservationRead[]> {
    const token = this.pickToken();
    const userId = this.extractUserId(token);
    if (!token || !userId) return of([]);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${this.base}/api/reservations/user/${userId}`;
    return this.http.get<ReservationRead[]>(url, { headers }).pipe(
      catchError(() => of([]))
    );
  }

  /** Check if the current user has an active reservation for a given book */
  hasForCurrentUser(bookId: number): Observable<boolean> {
    const token = this.pickToken();
    const userId = this.extractUserId(token);
    if (!token || !userId) return of(false);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = `${this.base}/api/reservations/user/${userId}`;
    return this.http.get<ReservationRead[]>(url, { headers }).pipe(
      map(list =>
        Array.isArray(list) &&
        list.some(r => r.bookId === bookId && (r.status === 'Pending' || r.status === 'Available'))
      ),
      catchError(() => of(false))
    );
  }

  /** POST a new reservation for the current user */
  createForCurrentUser(bookId: number): Observable<ReservationRead> {
    const token  = this.pickToken();
    const userId = this.extractUserId(token);
    if (!token || !userId) {
      return throwError(() => ({ status: 401, error: { error: 'Not authenticated' } }));
    }
    const url = `${this.base}/api/reservations`;
    const body = { userId, bookId };
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post<ReservationRead>(url, body, { headers });
  }

  // ===== Helper methods for JWT handling =====

  /** Pick the JWT token from localStorage or sessionStorage */
  private pickToken(): string | null {
    return (
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      sessionStorage.getItem('token')
    );
  }

  /** Extract the current user ID robustly from JWT claims */
  private extractUserId(token: string | null): number | null {
    if (!token) return null;
    try {
      const part = token.split('.')[1] || '';
      let norm = part.replace(/-/g, '+').replace(/_/g, '/');
      while (norm.length % 4) norm += '=';
      const json = decodeURIComponent(
        atob(norm).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      const p = JSON.parse(json);
      const candidates = [
        p.userId, p.userid, p.UserId, p.uid, p.sub, p.nameid,
        p['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      ];
      const raw = candidates.find(v => v !== undefined && v !== null);
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  }
}
