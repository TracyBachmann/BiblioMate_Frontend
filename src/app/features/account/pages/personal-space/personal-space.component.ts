// src/app/features/account/pages/personal-space/personal-space.component.ts
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

  private firstName = toSignal(this.auth.firstName$, { initialValue: 'Prénom' as string | null });
  private lastName  = toSignal(this.auth.lastName$,  { initialValue: 'NOM' as string | null });
  private roleSrv   = toSignal(this.auth.role$,      { initialValue: null as ServiceRole });

  readonly subline =
    'Gérez facilement vos informations et vos interactions avec la bibliothèque.';

  private readonly _fullName = computed(
    () => `${this.firstName() ?? 'Prénom'} ${this.lastName() ?? 'NOM'}`.trim()
  );

  private readonly _options = computed<NavOption[]>(() => {
    const role = mapRole(this.roleSrv());
    const base: NavOption[] = [
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

    if (role === 'librarian' || role === 'admin') {
      base.push(
        {
          title: 'Gestion des livres',
          subtitle: 'Ajouter, éditer, supprimer des titres',
          image: 'assets/images/manage-books.jpg',
          link: ['/gestion/livres'],
        },
        {
          title: 'Demandes & réservations',
          subtitle: 'Valider, refuser, notifier',
          image: 'assets/images/manage-requests.jpg',
          link: ['/gestion/reservations'],
        }
      );
    }

    if (role === 'admin') {
      base.push({
        title: 'Utilisateurs',
        subtitle: 'Comptes, rôles et permissions',
        image: 'assets/images/users.jpg',
        link: ['/admin/utilisateurs'],
      });
    }

    return base;
  });

  // --- Getters utilisés par le template
  get fullName(): string { return this._fullName(); }
  get options(): NavOption[] { return this._options(); }
}
