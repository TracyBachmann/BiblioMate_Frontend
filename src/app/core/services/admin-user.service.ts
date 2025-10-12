import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

type UserRole = 'User' | 'Librarian' | 'Admin';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private apiUrl = `${environment.apiBase}/api/users`;
  private authUrl = `${environment.apiBase}/api/auths`;

  constructor(private http: HttpClient) {}

  /**
   * GET tous les utilisateurs
   * @param pendingOnly - Si true, ne retourne que les comptes en attente
   */
  getAllUsers(pendingOnly = false): Observable<any[]> {
    let params = new HttpParams();
    if (pendingOnly) {
      params = params.set('pendingValidation', 'true');
    }
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  /**
   * POST valider un compte utilisateur
   */
  validateUser(userId: number): Observable<any> {
    return this.http.post(`${this.authUrl}/approve/${userId}`, {});
  }

  /**
   * POST rejeter un compte utilisateur
   */
  rejectUser(userId: number, reason?: string): Observable<any> {
    return this.http.post(`${this.authUrl}/reject/${userId}`, {
      Reason: reason ?? null
    });
  }

  /**
   * PUT modifier le rôle d'un utilisateur
   */
  updateUserRole(userId: number, role: UserRole): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/role`, { role });
  }

  /**
   * DELETE supprimer un utilisateur
   */
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }
}

