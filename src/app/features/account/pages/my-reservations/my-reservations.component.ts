import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';

import { ReservationsService, ReservationRead } from '../../../../core/services/reservations.service';
import { BookService, Book } from '../../../../core/services/book.service';
import { HttpErrorResponse } from '@angular/common/http';

/** Available sort keys for reservations */
type SortBy = 'expirationDate' | 'reservationDate' | 'title';
/** Available sort directions */
type SortDir = 'asc' | 'desc';

/** Filters applied to reservations list */
interface Filters {
  sortBy: SortBy;
  sortDir: SortDir;
  availableOnly: boolean;
  resFrom: string;
  resTo: string;
  expFrom: string;
  expTo: string;
}

/** ViewModel for reservations used in template */
interface ReservationVM {
  id: string | number;
  bookId: number;
  title: string;
  coverUrl: string | null;
  description: string;
  reservationDate: string;  // formatted dd/MM/yyyy
  expirationDate: string;   // formatted dd/MM/yyyy
  resAt: number | null;     // timestamp (start of day)
  expAt: number | null;     // timestamp (start of day)
  available: boolean;
}

/**
 * MyReservationsComponent
 * -------------------------
 * Displays the current user's active reservations.
 * - Fetches reservations from backend
 * - Applies live search, advanced filters, and sorting
 * - Enriches reservations with missing book metadata (cover/description)
 * - Supports local cancellation
 */
@Component({
  standalone: true,
  selector: 'app-my-reservations',
  imports: [CommonModule, FormsModule, NgOptimizedImage, SectionTitleComponent, BookCardComponent],
  templateUrl: './my-reservations.component.html',
  styleUrls: ['./my-reservations.component.scss']
})
export class MyReservationsComponent implements OnInit {
  // --- Services ---
  private api = inject(ReservationsService); // reservations API
  private books = inject(BookService);       // book metadata API

  // --- UI state ---
  query = signal<string>('');                // live search query
  advanced = signal<boolean>(false);         // toggle advanced filters

  filters = signal<Filters>({
    sortBy: 'expirationDate',
    sortDir: 'asc',
    availableOnly: false,
    resFrom: '',
    resTo: '',
    expFrom: '',
    expTo: ''
  });

  /** Full dataset (from API, enriched progressively) */
  private allReservations = signal<ReservationVM[]>([]);
  /** Filtered and sorted dataset bound to template */
  reservations = signal<ReservationVM[]>([]);

  // ---------------- Lifecycle ----------------

  ngOnInit(): void {
    this.loadReservations();
  }

  /**
   * Load reservations for the current user.
   * - Maps them into ViewModels
   * - Applies initial filters
   * - Triggers enrichment if book metadata is missing
   */
  private loadReservations() {
    this.api.getForCurrentUser().subscribe({
      next: (rows: ReservationRead[]) => {
        const mapped = (rows ?? []).map(this.toVM);
        this.allReservations.set(mapped);
        this.applyFiltersNow();

        // Enrich if description/cover are missing
        this.enrichMissingBookMeta(mapped);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des réservations', err);
        this.allReservations.set([]);
        this.applyFiltersNow();
      }
    });
  }

  /**
   * Enrich reservations with missing description or cover image
   * by fetching book metadata for unique bookIds.
   */
  private enrichMissingBookMeta(list: ReservationVM[]) {
    const needs = list.filter(r => !(r.description && r.description.trim()) || !r.coverUrl);
    if (!needs.length) {return;}

    const requests: Record<number, ReturnType<BookService['getById']>> = {};
    for (const r of needs) {
      // avoid duplicate requests for same bookId
      if (!requests[r.bookId]) {requests[r.bookId] = this.books.getById(r.bookId);}
    }

    forkJoin(requests).subscribe((bookMap: Record<string, Book | any>) => {
      this.allReservations.update(current =>
        current.map(r => {
          const b: any = bookMap[String(r.bookId)];
          if (!b) {return r;}
          const desc = r.description && r.description.trim()
            ? r.description
            : (b.description ?? b.desc ?? '');
          const cover = r.coverUrl ?? (b.coverUrl ?? b.cover ?? b.imageUrl ?? null);
          return { ...r, description: desc, coverUrl: cover };
        })
      );
      // reapply filters now that metadata is enriched
      this.applyFiltersNow();
    });
  }

  // ---------------- Filters & Search ----------------

  /** Called when search query changes */
  onQueryChange(v: string) {
    this.query.set(v);
    this.applyFiltersNow();
  }

  /** Called when a filter value changes */
  onFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    this.filters.update(f => ({ ...f, [key]: value as any }));
    this.applyFiltersNow();
  }

  /** Reset all filters to their defaults */
  resetFilters() {
    this.query.set('');
    this.filters.set({
      sortBy: 'expirationDate',
      sortDir: 'asc',
      availableOnly: false,
      resFrom: '',
      resTo: '',
      expFrom: '',
      expTo: ''
    });
    this.applyFiltersNow();
  }

  /**
   * Apply all filters and sorting to the full dataset
   * to produce the reservations displayed in UI.
   */
  applyFiltersNow() {
    const src = this.allReservations();
    const f = this.filters();
    const q = this.normalize(this.query());

    const resStart = this.dateInputToStartMs(f.resFrom);
    const resEnd   = this.dateInputToEndMs(f.resTo);
    const expStart = this.dateInputToStartMs(f.expFrom);
    const expEnd   = this.dateInputToEndMs(f.expTo);

    const out = src.filter(r => {
      if (q) {
        const t = this.normalize(r.title);
        const d = this.normalize(r.description);
        if (!t.includes(q) && !d.includes(q)) {return false;}
      }
      if (f.availableOnly && !r.available) {return false;}
      if (resStart !== null && (r.resAt === null || r.resAt < resStart)) {return false;}
      if (resEnd   !== null && (r.resAt === null || r.resAt > resEnd))   {return false;}
      if (expStart !== null && (r.expAt === null || r.expAt < expStart)) {return false;}
      if (expEnd   !== null && (r.expAt === null || r.expAt > expEnd))   {return false;}
      return true;
    });

    // sorting
    const dir = f.sortDir === 'asc' ? 1 : -1;
    out.sort((a, b) => {
      switch (f.sortBy) {
        case 'title': return dir * a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
        case 'reservationDate': return dir * ((a.resAt ?? Infinity) - (b.resAt ?? Infinity));
        case 'expirationDate':
        default: return dir * ((a.expAt ?? Infinity) - (b.expAt ?? Infinity));
      }
    });

    this.reservations.set(out);
  }

  // ---------------- Actions ----------------

  /**
   * Cancel a reservation locally (no backend call).
   * Removes it from state and reapplies filters.
   */
  cancel: (id: string | number) => void = (id) => {
    const rid = typeof id === 'string' ? Number(id) : id;
    this.allReservations.update(list => list.filter(r => Number(r.id) !== rid));
    this.applyFiltersNow();
    alert('Votre réservation a été annulée.');
  };

  // ---------------- Mapping ----------------

  /**
   * Convert API DTO into ReservationVM used by template.
   */
  private toVM = (dto: ReservationRead): ReservationVM => {
    const expIso = dto.expirationDate ?? (dto as any).ExpirationDate ?? null;
    const resIso = dto.reservationDate;

    return {
      id: dto.reservationId,
      bookId: dto.bookId,
      title: dto.bookTitle ?? '—',
      coverUrl: (dto as any).coverUrl ?? null,
      description: (dto as any).description ?? '',
      reservationDate: this.formatDate(resIso),
      expirationDate: this.formatDate(expIso),
      resAt: this.toStartMs(resIso),
      expAt: this.toStartMs(expIso),
      available: dto.status === 'Available'
    };
  };

  // ---------------- Helpers ----------------

  /** Format date-like value to dd/MM/yyyy (fr-FR locale) */
  private formatDate(v: any): string {
    if (!v) {return '';}
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fr-FR');
  }

  /** Normalize string (lowercase, remove accents) for search matching */
  private normalize(s: string): string {
    return (s ?? '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  /** Convert ISO/date to timestamp at start of day */
  private toStartMs(v: any): number | null {
    if (!v) {return null;}
    try {
      const d = new Date(v);
      if (isNaN(d.getTime())) {return null;}
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    } catch { return null; }
  }

  /** Convert input[type=date] value to start-of-day timestamp */
  private dateInputToStartMs(s: string): number | null {
    if (!s) {return null;}
    return this.toStartMs(s);
  }

  /** Convert input[type=date] value to end-of-day timestamp */
  private dateInputToEndMs(s: string): number | null {
    if (!s) {return null;}
    const start = this.toStartMs(s);
    return start === null ? null : start + 24 * 60 * 60 * 1000 - 1;
  }
}

