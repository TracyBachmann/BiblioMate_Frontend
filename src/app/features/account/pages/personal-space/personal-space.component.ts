import { Component, computed, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavCardComponent } from '../../../../shared/components/nav-card/nav-card.component';
import { AuthService, UserRole as ServiceRole } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

type UserRole = 'user' | 'librarian' | 'admin';

interface NavOption {
  title: string;
  subtitle?: string;
  image: string;
  link: string | any[];
}

/**
 * Maps the role coming from AuthService (ServiceRole)
 * into normalized lowercase roles used by this component.
 */
function mapRole(r: ServiceRole | null): UserRole {
  if (!r) return 'user';
  const norm = String(r).toLowerCase();
  if (norm.includes('admin')) return 'admin';
  if (norm.includes('librarian')) return 'librarian';
  return 'user';
}

@Component({
  selector: 'app-personal-space',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage, NavCardComponent],
  templateUrl: './personal-space.component.html',
  styleUrls: ['./personal-space.component.scss'],
})
export class PersonalSpaceComponent {
  public auth = inject(AuthService);

  // Signals derived from AuthService observables
  private firstName = toSignal(this.auth.firstName$, { initialValue: 'Prénom' as string | null });
  private lastName  = toSignal(this.auth.lastName$,  { initialValue: 'NOM' as string | null });
  private roleSrv   = toSignal(this.auth.role$,      { initialValue: null as ServiceRole });

  // Static subtitle displayed under the hero welcome message
  readonly subline =
    'Gérez facilement vos informations et vos interactions avec la bibliothèque.';

  // Computed full name (fallbacks if first/last names are null)
  private readonly _fullName = computed(
    () => `${this.firstName() ?? 'Prénom'} ${this.lastName() ?? 'NOM'}`.trim()
  );

  /**
   * Computed navigation options for the personal space.
   * The list of navigation cards changes depending on the user role.
   */
  private readonly _options = computed<NavOption[]>(() => {
    const role = mapRole(this.roleSrv());

    // Cards available for regular users
    const personal: NavOption[] = [
      {
        title: 'Profil',
        subtitle: 'Modifier vos informations personnelles',
        image: 'assets/images/profile.png',
        link: ['/espace/profil'],
      },
      {
        title: 'Emprunts',
        subtitle: 'Consulter l’historique et les prêts en cours',
        image: 'assets/images/loans.png',
        link: ['/espace/mes-emprunts'],
      },
      {
        title: 'Réservations',
        subtitle: 'Suivre et gérer vos demandes de livres',
        image: 'assets/images/reservations.png',
        link: ['/espace/mes-reservations'],
      },
    ];

    // Cards available for librarians
    const staff: NavOption[] = [
      {
        title: 'Gestion des livres',
        subtitle: 'Cataloguer les titres et gérer le stock',
        image: 'assets/images/manage-books.jpg',
        link: ['/catalogue/gestion'],
      },
      {
        title: 'Suivi des prêts',
        subtitle: 'Prêts, retours, prolongations et réservations',
        image: 'assets/images/manage-requests.jpg',
        link: ['/gestion/reservations'],
      },
      {
        title: 'Notifications',
        subtitle: 'Envoyer des messages et des relances',
        image: 'assets/images/notifications.jpg',
        link: ['/gestion/notifications'],
      }
    ];

    // Extra cards only visible for administrators
    const adminOnly: NavOption[] = [
      {
        title: 'Utilisateurs',
        subtitle: 'Comptes, rôles et permissions',
        image: 'assets/images/users.jpg',
        link: ['/admin/utilisateurs'],
      },
    ];

    // Selection rules based on role
    switch (role) {
      case 'librarian':
        return [...staff];               // Librarians only see staff cards
      case 'admin':
        return [...staff, ...adminOnly]; // Admins see staff + admin cards
      case 'user':
      default:
        return [...personal];            // Regular users only see personal cards
    }
  });

  // --- Getters used by the template
  get fullName(): string { return this._fullName(); }
  get options(): NavOption[] { return this._options(); }
}

