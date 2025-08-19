import { Component, computed, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavCardComponent } from '../../../../shared/components/nav-card/nav-card.component';

type UserRole = 'user' | 'librarian' | 'admin';

interface NavOption {
  title: string;
  subtitle?: string;
  image: string;
  link: string | any[];
}

@Component({
  selector: 'app-personal-space',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage, NavCardComponent],
  templateUrl: './personal-space.component.html',
  styleUrls: ['./personal-space.component.scss'],
})
export class PersonalSpaceComponent {
  // mock user signals (plug your auth later)
  firstName = signal('Prénom');
  lastName = signal('NOM');
  role = signal<UserRole>('user');

  readonly subline =
    'Gérez facilement vos informations et vos interactions avec la bibliothèque.';

  private readonly _options = computed<NavOption[]>(() => {
    const base: NavOption[] = [
      {
        title: 'Profil',
        subtitle: 'Modifier vos informations personnelles',
        image: 'assets/images/personal/profile.jpg',
        link: ['/espace/profil'],
      },
      {
        title: 'Emprunts',
        subtitle: 'Consulter l’historique et les prêts en cours',
        image: 'assets/images/personal/loans.jpg',
        link: ['/espace/emprunts'],
      },
      {
        title: 'Réservations',
        subtitle: 'Suivre et gérer vos demandes de livres',
        image: 'assets/images/personal/reservations.jpg',
        link: ['/espace/reservations'],
      },
    ];

    if (this.role() === 'librarian' || this.role() === 'admin') {
      base.push(
        {
          title: 'Gestion des livres',
          subtitle: 'Ajouter, éditer, supprimer des titres',
          image: 'assets/images/personal/manage-books.jpg',
          link: ['/gestion/livres'],
        },
        {
          title: 'Demandes & réservations',
          subtitle: 'Valider, refuser, notifier',
          image: 'assets/images/personal/manage-requests.jpg',
          link: ['/gestion/reservations'],
        }
      );
    }

    if (this.role() === 'admin') {
      base.push({
        title: 'Utilisateurs',
        subtitle: 'Comptes, rôles et permissions',
        image: 'assets/images/personal/users.jpg',
        link: ['/admin/utilisateurs'],
      });
    }

    return base;
  });

  private readonly _fullName = computed(() => `${this.firstName()} ${this.lastName()}`);

  // 👉 getters used in the template (no function-call warnings)
  get fullName(): string {
    return this._fullName();
  }
  get options(): NavOption[] {
    return this._options();
  }
}
