// src/app/features/account/pages/personal-space/personal-space.component.ts
import { Component, computed, effect, inject } from '@angular/core';
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

/** Décodage local du JWT (debug only) */
function parseJwt(token: string | null): any | null {
  if (!token) return null;
  try {
    const base64 = token.split('.')[1];
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

@Component({
  selector: 'app-personal-space',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage, NavCardComponent],
  templateUrl: './personal-space.component.html',
  styleUrls: ['./personal-space.component.scss'],
})
export class PersonalSpaceComponent {
  // ✅ injection fonctionnelle — dispo immédiatement pour les initialisations ci-dessous
  public auth = inject(AuthService);

  // ⚡️ Noms & rôle depuis le token (avec valeurs par défaut)
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
        link: ['/espace/emprunts'],
      },
      {
        title: 'Réservations',
        subtitle: 'Suivre et gérer vos demandes de livres',
        image: 'assets/images/reservations.png',
        link: ['/espace/reservations'],
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

  // --- Logs de diagnostic (automatiques dès que les valeurs changent)
  private _logUserInfo = effect(() => {
    const f = this.firstName();
    const l = this.lastName();
    const r = this.roleSrv();
    const fn = this._fullName();

    // token + claims
    const token = this.auth.getToken?.() ?? null;
    const claims = parseJwt(token);

    console.groupCollapsed('%c[PersonalSpace] Diagnostic utilisateur', 'color:#0E5AA6;font-weight:600;');
    console.log('firstName$', f);
    console.log('lastName$', l);
    console.log('role$', r);
    console.log('fullName (computed)', fn);
    console.log('token présent ?', !!token);
    if (claims) {
      console.log('claims keys:', Object.keys(claims));
      console.log('→ given_name:', claims.given_name);
      console.log('→ family_name:', claims.family_name);
      console.log('→ name:', claims.name);
      console.log('→ firstName / lastName (custom):', claims.firstName, claims.lastName);
      console.log('→ .NET claims:',
        claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'],
        claims['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname']
      );
      console.log('payload complet:', claims);
    } else {
      console.log('Impossible de décoder le JWT (token null ou format invalide).');
    }
    console.groupEnd();
  });

  private _logOptions = effect(() => {
    const opts = this._options();
    console.debug('[PersonalSpace] Options visibles:', opts.map(o => o.title));
  });
}
