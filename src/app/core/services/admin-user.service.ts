import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment';

/**
 * AdminUserService
 * ========================================
 * Gère toutes les opérations admin liées aux utilisateurs
 * Pas besoin d'interfaces séparées, tout est typé inline !
 */
@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private apiUrl = `${environment.apiBase}/api/admin/users`;

  constructor(private http: HttpClient) {}

  /**
   * GET tous les utilisateurs
   * @param pendingOnly - Si true, ne retourne que les comptes en attente
   */
  getAllUsers(pendingOnly = false): Observable<any[]> {
    const params = pendingOnly ? { pendingValidation: 'true' } : {};
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  /**
   * POST valider un compte utilisateur
   * @param userId - ID de l'utilisateur à valider
   */
  validateUser(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/validate`, {});
  }

  /**
   * POST rejeter un compte utilisateur
   * @param userId - ID de l'utilisateur à rejeter
   * @param reason - Raison du rejet (optionnel)
   */
  rejectUser(userId: number, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/reject`, {
      reason: reason || null
    });
  }

  /**
   * PUT modifier le rôle d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param role - Nouveau rôle ('User' | 'Librarian' | 'Admin')
   */
  updateUserRole(userId: number, role: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}/role`, { role });
  }

  /**
   * DELETE supprimer un utilisateur
   * @param userId - ID de l'utilisateur à supprimer
   */
  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }
}
