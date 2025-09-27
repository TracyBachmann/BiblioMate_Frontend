import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

/** DTO representing the current user's profile */
export interface UserProfile {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  address1?: string;
  address2?: string;
  phone?: string;
  dateOfBirth?: string;      // stored as ISO string on frontend
  profileImagePath?: string;
  favoriteGenreIds?: number[];
}

/**
 * Service to interact with the user API
 * ---------------------------------------------------
 * Provides methods to:
 *  - Fetch the current user's profile
 *  - Update the current user's profile
 *  - Delete the current user's account
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiBase}/api/users`;

  constructor(private http: HttpClient) {}

  /** GET the current user's profile */
  getCurrentUser(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  /**
   * PUT update the current user's profile
   * Only includes fields expected by the backend DTO
   */
  updateCurrentUser(data: Partial<UserProfile>): Observable<any> {
    const payload = {
      firstName: data.firstName?.trim() ?? '',
      lastName: data.lastName?.trim() ?? '',
      email: data.email?.trim() ?? '',
      phone: data.phone?.trim() ?? '',
      address1: data.address1?.trim() || null,
      address2: data.address2?.trim() || null,
      dateOfBirth: data.dateOfBirth
        ? new Date(data.dateOfBirth).toISOString()
        : null
    };

    return this.http.put(`${this.apiUrl}/me`, payload);
  }

  /** DELETE the current user's account */
  deleteCurrentUser(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/me`);
  }
}
