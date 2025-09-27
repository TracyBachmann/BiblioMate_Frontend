import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';
import { LoansService, LoanRow } from '../../../../core/services/loan.service';

type SortBy = 'dueDate' | 'loanDate' | 'title';
type SortDir = 'asc' | 'desc';

type Filters = {
  sortBy: SortBy;
  sortDir: SortDir;
  overdueOnly: boolean;
  dueSoonDays: number | null;
  loanFrom: string;
  loanTo: string;
  dueFrom: string;
  dueTo: string;
};

/** ViewModel used internally for display */
type LoanVM = {
  id: number | string;           // LoanId from API
  bookId: number;                // Needed for routerLink navigation
  title: string;
  coverUrl: string | null;
  description: string;
  loanDate: string;              // formatted (fr-FR)
  returnDate: string;            // formatted (fr-FR)
  loanAt: number | null;         // normalized timestamp (start of day)
  dueAt: number | null;          // normalized timestamp (start of day)
  overdue: boolean;
};

@Component({
  standalone: true,
  selector: 'app-my-loans',
  imports: [CommonModule, FormsModule, NgOptimizedImage, SectionTitleComponent, BookCardComponent],
  templateUrl: './my-loans.component.html',
  styleUrls: ['./my-loans.component.scss'],
})
export class MyLoansComponent implements OnInit {
  private loansApi = inject(LoansService);

  // --- UI state ---
  query = signal<string>('');                  // free text search
  advanced = signal<boolean>(false);           // toggle advanced filters
  viewMode = signal<'grid' | 'list'>('grid');  // list/grid toggle

  // --- Filters state ---
  filters = signal<Filters>({
    sortBy: 'dueDate',
    sortDir: 'asc',
    overdueOnly: false,
    dueSoonDays: null,
    loanFrom: '',
    loanTo: '',
    dueFrom: '',
    dueTo: '',
  });

  // --- Data ---
  private allLoans = signal<LoanVM[]>([]); // full dataset (before filters)
  loans = signal<LoanVM[]>([]);            // filtered + sorted list for UI

  ngOnInit(): void {
    // Fetch active loans for current user
    this.loansApi.getMyActive().subscribe({
      next: (rows: LoanRow[]) => {
        const mapped = (rows ?? []).map(this.toVM);
        this.allLoans.set(mapped);
        this.applyFiltersNow();
      },
      error: (err: HttpErrorResponse) => {
        console.error('getMyActive failed', err);
        this.seedFallback(); // fallback with demo data
      },
    });
  }

  // --- Live search ---
  onQueryChange(v: string) {
    this.query.set(v);
    this.applyFiltersNow();
  }

  // --- Live filter updates ---
  onFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    this.filters.update(f => ({ ...f, [key]: value as any }));
    this.applyFiltersNow();
  }

  /** Reset all filters to defaults */
  resetFilters() {
    this.query.set('');
    this.filters.set({
      sortBy: 'dueDate',
      sortDir: 'asc',
      overdueOnly: false,
      dueSoonDays: null,
      loanFrom: '',
      loanTo: '',
      dueFrom: '',
      dueTo: '',
    });
    this.applyFiltersNow();
  }

  /** Apply filters + sorting to current dataset */
  applyFiltersNow() {
    const src = this.allLoans();
    const f = this.filters();
    const q = this.normalize(this.query());

    // Prepare date ranges
    const loanStart = this.dateInputToStartMs(f.loanFrom);
    const loanEnd   = this.dateInputToEndMs(f.loanTo);
    const dueStart  = this.dateInputToStartMs(f.dueFrom);
    const dueEnd    = this.dateInputToEndMs(f.dueTo);

    const todayStart = this.startOfTodayMs();
    const soonLimit  = f.dueSoonDays && f.dueSoonDays > 0
      ? this.addDaysMs(todayStart, f.dueSoonDays)
      : null;

    // Filtering pass
    let out = src.filter(l => {
      if (q) {
        const t = this.normalize(l.title);
        const d = this.normalize(l.description);
        if (!t.includes(q) && !d.includes(q)) return false;
      }
      if (f.overdueOnly && !l.overdue) return false;
      if (soonLimit != null) {
        if (l.dueAt == null || l.dueAt > soonLimit) return false;
      }
      if (loanStart != null && (l.loanAt == null || l.loanAt < loanStart)) return false;
      if (loanEnd   != null && (l.loanAt == null || l.loanAt > loanEnd))   return false;
      if (dueStart  != null && (l.dueAt  == null || l.dueAt  < dueStart))  return false;
      if (dueEnd    != null && (l.dueAt  == null || l.dueAt  > dueEnd))    return false;
      return true;
    });

    // Sorting
    const dir = f.sortDir === 'asc' ? 1 : -1;
    out.sort((a, b) => {
      switch (f.sortBy) {
        case 'title': return dir * a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
        case 'loanDate': return dir * ((a.loanAt ?? Infinity) - (b.loanAt ?? Infinity));
        case 'dueDate':
        default: return dir * ((a.dueAt ?? Infinity) - (b.dueAt ?? Infinity));
      }
    });

    this.loans.set(out);
  }

  /** Trigger loan extension by ID */
  extend = (id: string | number): void => {
    const loanId = Number(id);
    this.loansApi.extendLoan(loanId).subscribe({
      next: (resp: any) => {
        const due = resp?.dueDate ?? resp?.DueDate;
        if (due) {
          const dueAt = this.toStartMs(due);
          this.loans.update(list =>
            list.map(l =>
              l.id === loanId
                ? { ...l, returnDate: this.formatDate(due), dueAt, overdue: this.isOverdue(dueAt) }
                : l
            )
          );
          this.applyFiltersNow();
          alert(`Votre emprunt a été prolongé jusqu’au ${this.formatDate(due)}.`);
        } else {
          alert('Emprunt prolongé.');
        }
      },
      error: (e) => {
        const msg = e?.error?.error || 'Impossible de prolonger cet emprunt pour le moment.';
        alert(msg);
      },
    });
  };

  /** Seed fallback demo loans in case API fails */
  private seedFallback() {
    const demo: LoanVM[] = [
      {
        id: 1,
        bookId: 101,
        title: '1984',
        coverUrl: null,
        description: 'Roman dystopique de George Orwell.',
        loanDate: '01/09/2025',
        returnDate: '20/09/2025',
        loanAt: this.toStartMs('2025-09-01'),
        dueAt: this.toStartMs('2025-09-20'),
        overdue: false,
      },
      {
        id: 2,
        bookId: 102,
        title: "Harry Potter à l'école des sorciers",
        coverUrl: null,
        description: 'Premier tome de la saga Harry Potter.',
        loanDate: '05/09/2025',
        returnDate: '25/09/2025',
        loanAt: this.toStartMs('2025-09-05'),
        dueAt: this.toStartMs('2025-09-25'),
        overdue: false,
      },
      {
        id: 3,
        bookId: 103,
        title: 'Fondation',
        coverUrl: null,
        description: 'Cycle de science-fiction.',
        loanDate: '20/08/2025',
        returnDate: '05/09/2025',
        loanAt: this.toStartMs('2025-08-20'),
        dueAt: this.toStartMs('2025-09-05'),
        overdue: true,
      },
    ];
    this.allLoans.set(demo);
    this.applyFiltersNow();
  }

  /** Map API LoanRow into LoanVM (handles casing variants) */
  private toVM = (r: LoanRow | any): LoanVM => {
    const book = (r as any).book ?? (r as any).Book ?? {};
    const title =
      (r as any).bookTitle ?? (r as any).BookTitle ??
      book.title ?? book.Title ??
      (r as any).title ?? (r as any).Title ?? '—';

    const coverUrl =
      (r as any).coverUrl ?? (r as any).CoverUrl ??
      book.coverUrl ?? book.CoverUrl ?? null;

    const description =
      (r as any).description ?? (r as any).Description ??
      book.description ?? book.Description ?? '';

    const loanId = (r as any).loanId ?? (r as any).LoanId ?? (r as any).id ?? (r as any).Id;
    const bookId = (r as any).bookId ?? (r as any).BookId ?? 0;
    const loanRaw = (r as any).loanDate ?? (r as any).LoanDate ?? (r as any).date ?? (r as any).Date;
    const dueRaw  = (r as any).dueDate  ?? (r as any).DueDate  ?? (r as any).returnDate ?? (r as any).ReturnDate;

    const loanAt = this.toStartMs(loanRaw);
    const dueAt  = this.toStartMs(dueRaw);

    return {
      id: loanId,
      bookId,
      title,
      coverUrl,
      description,
      loanDate: this.formatDate(loanRaw),
      returnDate: this.formatDate(dueRaw),
      loanAt,
      dueAt,
      overdue: this.isOverdue(dueAt),
    };
  };

  // --- Helpers (date formatting, normalization, conversions) ---
  private formatDate(v: any): string {
    if (!v) return '';
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('fr-FR');
  }

  private normalize(s: string): string {
    return (s ?? '').toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  toNumberOrNull(v: any): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private startOfTodayMs(): number {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
  }
  private addDaysMs(ms: number, days: number): number {
    return ms + days * 24 * 60 * 60 * 1000;
  }
  private toStartMs(v: any): number | null {
    if (!v) return null;
    try {
      const s = String(v);
      const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00`) : new Date(s);
      if (isNaN(d.getTime())) return null;
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    } catch { return null; }
  }
  private dateInputToStartMs(s: string): number | null {
    if (!s) return null; return this.toStartMs(s);
  }
  private dateInputToEndMs(s: string): number | null {
    if (!s) return null;
    const start = this.toStartMs(s);
    return start == null ? null : this.addDaysMs(start, 1) - 1;
  }
  private isOverdue(dueAt: number | null): boolean {
    if (dueAt == null) return false;
    return dueAt < this.startOfTodayMs();
  }
}

