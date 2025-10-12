import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';

interface Toast {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ConfirmModal {
  title: string;
  message: string;
  confirmText: string;
  isDanger?: boolean;
  needsReason?: boolean;
  action: () => void;
}

// Interface pour typer les données utilisateur
interface UserData {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isValidated: boolean;
  registrationDate: string;
  fullName?: string;
  statusLabel?: string;
  registrationDateFormatted?: string;
  [key: string]: any; // Pour permettre l'accès dynamique aux propriétés
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, SectionTitleComponent, NgOptimizedImage],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: UserData[] = [];
  filteredUsers: UserData[] = [];
  loading = true;
  searchQuery = '';
  advancedSearchOpen = false;
  filterRole = '';
  filterStatus = '';
  toast: Toast | null = null;
  confirmModal: ConfirmModal | null = null;
  rejectionReason = '';

  columns: TableColumn[] = [
    { key: 'userId', label: 'ID', width: '80px' },
    { key: 'fullName', label: 'Nom complet', width: '200px' },
    { key: 'email', label: 'Email', width: '250px' },
    { key: 'role', label: 'Rôle', width: '130px' },
    { key: 'statusLabel', label: 'Statut', width: '150px' }
  ];

  tableActions: TableAction<UserData>[] = [
    {
      icon: 'assets/images/icon-check.svg',
      label: 'Valider',
      handler: (user: UserData) => this.openValidateModal(user)
    },
    {
      icon: 'assets/images/icon-close.svg',
      label: 'Rejeter',
      handler: (user: UserData) => this.openRejectModal(user)
    },
    {
      icon: 'assets/images/icon-edit.svg',
      label: 'Modifier le rôle',
      handler: (user: UserData) => this.openRoleModal(user)
    },
    {
      icon: 'assets/images/icon-trash.svg',
      label: 'Supprimer',
      handler: (user: UserData) => this.openDeleteModal(user)
    }
  ];

  constructor(
    private adminUserService: AdminUserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminUserService.getAllUsers().subscribe({
      next: (users: any[]) => {
        this.users = users.map(u => this.enrichUser(u));
        this.applyFilters();
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des utilisateurs', err);
        this.showToast('error', 'Impossible de charger les utilisateurs.');
        this.loading = false;
      }
    });
  }

  enrichUser(user: any): UserData {
    // Gérer la date d'inscription (peut être sous différents noms)
    let regDate = user.registrationDate || user.createdAt || user.createdDate || new Date().toISOString();

    return {
      ...user,
      fullName: `${user.firstName} ${user.lastName}`,
      // Option A : Basé sur IsApproved uniquement
      statusLabel: user.isApproved ? '✓ Validé' : '⏳ En attente',
      // Option B : Plus détaillé avec email
      // statusLabel: !user.isEmailConfirmed ? '📧 Email non confirmé' 
      //   : user.isApproved ? '✓ Validé' 
      //   : '⏳ En attente validation',
      registrationDateFormatted: new Date(regDate).toLocaleDateString('fr-FR')
    };
  }

  onSearch(): void {
    this.applyFilters();
  }

  toggleAdvancedSearch(): void {
    this.advancedSearchOpen = !this.advancedSearchOpen;
  }

  applyFilters(): void {
    let result = [...this.users];

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(u =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    if (this.filterRole) {
      result = result.filter(u => u.role === this.filterRole);
    }

    if (this.filterStatus === 'validated') {
      result = result.filter(u => u.isValidated);
    } else if (this.filterStatus === 'pending') {
      result = result.filter(u => !u.isValidated);
    }

    this.filteredUsers = result;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterRole = '';
    this.filterStatus = '';
    this.applyFilters();
  }

  openValidateModal(user: UserData): void {
    if (user.isValidated) {
      this.showToast('info', 'Cet utilisateur est déjà validé.');
      return;
    }

    this.confirmModal = {
      title: 'Valider le compte',
      message: `Voulez-vous valider le compte de ${user.firstName} ${user.lastName} ?`,
      confirmText: 'Valider',
      action: () => this.validateUser(user.userId)
    };
  }

  openRejectModal(user: UserData): void {
    if (user.isValidated) {
      this.showToast('info', 'Cet utilisateur est déjà validé.');
      return;
    }

    this.confirmModal = {
      title: 'Rejeter le compte',
      message: `Voulez-vous rejeter le compte de ${user.firstName} ${user.lastName} ?`,
      confirmText: 'Rejeter',
      isDanger: true,
      needsReason: true,
      action: () => this.rejectUser(user.userId)
    };
  }

  openRoleModal(user: UserData): void {
    this.showToast('info', 'Modification de rôle : fonctionnalité à venir.');
  }

  openDeleteModal(user: UserData): void {
    this.confirmModal = {
      title: "Supprimer l'utilisateur",
      message: `Êtes-vous sûr de vouloir supprimer définitivement ${user.firstName} ${user.lastName} ?`,
      confirmText: 'Supprimer',
      isDanger: true,
      action: () => this.deleteUser(user.userId)
    };
  }

  closeConfirmModal(): void {
    this.confirmModal = null;
    this.rejectionReason = '';
  }

  confirmAction(): void {
    if (this.confirmModal) {
      this.confirmModal.action();
      this.closeConfirmModal();
    }
  }

  validateUser(userId: number): void {
    this.adminUserService.validateUser(userId).subscribe({
      next: () => {
        this.showToast('success', 'Utilisateur validé avec succès.');
        this.loadUsers();
      },
      error: (err: any) => {
        console.error('Erreur lors de la validation', err);
        this.showToast('error', "Impossible de valider l'utilisateur.");
      }
    });
  }

  rejectUser(userId: number): void {
    this.adminUserService.rejectUser(userId, this.rejectionReason).subscribe({
      next: () => {
        this.showToast('success', 'Compte rejeté.');
        this.loadUsers();
      },
      error: (err: any) => {
        console.error('Erreur lors du rejet', err);
        this.showToast('error', 'Impossible de rejeter le compte.');
      }
    });
  }

  deleteUser(userId: number): void {
    this.adminUserService.deleteUser(userId).subscribe({
      next: () => {
        this.showToast('success', 'Utilisateur supprimé.');
        this.loadUsers();
      },
      error: (err: any) => {
        console.error('Erreur lors de la suppression', err);
        this.showToast('error', "Impossible de supprimer l'utilisateur.");
      }
    });
  }

  addUser(): void {
    this.showToast('info', "Ajout d'utilisateur : fonctionnalité à venir.");
  }

  showToast(type: Toast['type'], message: string): void {
    this.toast = { type, message };
    setTimeout(() => this.toast = null, 5000);
  }
}