import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';
import { BookService, Book } from '../../../../core/services/book.service';

/* ============================================================
   Types
   ============================================================ */

/** Advanced search filters available in the UI */
type Filters = {
  isbn: string;
  author: string;
  genre: string;
  publisher: string;
  date: string;       // yyyy-MM-dd format (HTML date input)
  tags: string;
  availableNow: boolean;
  exclude: string;
};

/** Simplified book view model used for rendering cards */
type BookVM = {
  id: string;
  title: string;
  coverUrl: string;
  description: string;
  isAvailable: boolean;
};

@Component({
  standalone: true,
  selector: 'app-catalog-management',
  imports: [CommonModule, FormsModule, NgOptimizedImage, SectionTitleComponent, BookCardComponent],
  templateUrl: './catalog-management.component.html',
  styleUrls: ['./catalog-management.component.scss']
})
export class CatalogManagementComponent implements OnInit {
  /* ============================================================
     Dependencies
     ============================================================ */
  private router = inject(Router);
  private booksApi = inject(BookService);

  /* ============================================================
     State
     ============================================================ */
  query = signal<string>('');       // free-text query (title)
  advanced = signal<boolean>(false); // whether advanced filters are shown

  filters = signal<Filters>({
    isbn: '',
    author: '',
    genre: '',
    publisher: '',
    date: '',
    tags: '',
    availableNow: false,
    exclude: ''
  });

  results = signal<BookVM[]>([]); // search results

  /* ============================================================
     Pagination
     ============================================================ */
  pageSize = 6;
  pageIndex = signal(0);

  /** Compute total pages based on results length */
  totalPages = computed(() => {
    const n = Math.ceil(this.results().length / this.pageSize);
    return Array.from({ length: n }, (_, i) => i);
  });

  /** Slice current results according to pagination state */
  pagedResults = computed(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.results().slice(start, start + this.pageSize);
  });

  genres = signal<string[]>([]); // available genres for dropdown filter

  /* ============================================================
     Lifecycle
     ============================================================ */
  ngOnInit(): void {
    // Load available genres for filters
    this.booksApi.getGenres().subscribe({
      next: list => this.genres.set(list ?? []),
      error: () => this.genres.set([]),
    });

    // Initial search (fetch all books)
    this.search();
  }

  /* ============================================================
     UI Events
     ============================================================ */

  /** Triggered on text query change (live search) */
  onQueryChange(v: string) { this.query.set(v); this.search(); }

  /** Triggered when any advanced filter is changed */
  onFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    this.filters.update(f => ({ ...f, [key]: value }));
    this.search(); // live re-filter
  }

  /** Reset all filters to default values */
  resetFilters(): void {
    this.query.set('');
    this.filters.set({
      isbn: '', author: '', genre: '', publisher: '',
      date: '', tags: '', availableNow: false, exclude: ''
    });
    this.search();
  }

  /* ============================================================
     Mapping
     ============================================================ */

  /** Map raw API book entity into the simplified view model */
  private toVM(b: Book): BookVM {
    const anyb = b as any;
    const rawId = anyb.id ?? anyb.bookId ?? anyb.book_id ?? '';
    return {
      id: String(rawId),
      title: anyb.title ?? '',
      coverUrl: anyb.coverUrl ?? anyb.cover_url ?? '',
      description: anyb.description ?? '',
      isAvailable: !!(anyb.isAvailable ?? anyb.available ?? false),
    };
  }

  /* ============================================================
     Search
     ============================================================ */
  search(): void {
    const dto: any = {};
    const q = this.query().trim();
    if (q) dto.title = q;

    const f = this.filters();
    if (f.isbn.trim()) dto.isbn = f.isbn.trim();
    if (f.author.trim()) dto.author = f.author.trim();
    if (f.genre.trim()) dto.genre = f.genre.trim();
    if (f.publisher.trim()) dto.publisher = f.publisher.trim();
    if (f.date) {
      const y = new Date(f.date).getFullYear();
      dto.yearMin = y; dto.yearMax = y;
    }
    if (f.availableNow) dto.isAvailable = true;
    if (f.tags.trim()) dto.tagNames = f.tags.split(',').map(s => s.trim()).filter(Boolean);
    if (f.exclude.trim()) dto.exclude = f.exclude.trim();

    this.booksApi.search(dto).subscribe(items => {
      this.results.set(items.map(this.toVM));
      this.pageIndex.set(0); // reset to first page
    });
  }

  /* ============================================================
     CSV Import / Export
     ============================================================ */

  /** Handle CSV file import, map rows to BookVMs, and merge into results */
  onCSVSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;
      const rows = text.split(/\r?\n/).filter(r => r.trim().length > 0);
      if (!rows.length) return;

      // Parse header and map each row
      const header = rows[0].split(',').map(h => h.trim());
      const books = rows.slice(1).map(row => {
        const cols = row.split(',');
        const book: any = {};
        header.forEach((h, i) => { book[h] = cols[i] ? cols[i].trim() : ''; });
        return book;
      });

      // Locally merge parsed books into current results
      this.results.update(list => [...list, ...books.map(this.toVM)]);
      this.pageIndex.set(0);

      // Optionally: send to backend with bulkImport()
      // this.booksApi.bulkImport(books).subscribe(...)
    };

    reader.readAsText(file);
  }

  /** Export current results as CSV file */
  exportCSV(): void {
    const books = this.results();
    if (!books.length) {
      alert('Aucun livre à exporter.');
      return;
    }

    const headers = Object.keys(books[0]);
    const rows = [
      headers.join(','),
      ...books.map(b => headers.map(h => JSON.stringify((b as any)[h] ?? '')).join(','))
    ];
    const csvContent = rows.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'catalogue.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /* ============================================================
     Navigation: Create / Edit / Delete
     ============================================================ */

  /** Navigate to book creation page */
  createBook(): void {
    this.router.navigate(['/catalogue/ajout-livre'], { queryParams: { mode: 'new' } });
  }

  /** Navigate to book edition page */
  editBook = (id: string): void => {
    this.router.navigate(['/catalogue/ajout-livre'], { queryParams: { mode: 'edit', id } });
  };

  /** Delete book locally (and TODO: call API) */
  deleteBook = (id: string): void => {
    if (confirm('Supprimer ce livre ?')) {
      this.results.update(list => list.filter(b => b.id !== id));
      // TODO: call backend delete here if necessary
    }
  };

  /* ============================================================
     Pagination helpers
     ============================================================ */
  nextPage() {
    if (this.pageIndex() < this.totalPages().length - 1)
      this.pageIndex.update(i => i + 1);
  }

  prevPage() {
    if (this.pageIndex() > 0)
      this.pageIndex.update(i => i - 1);
  }

  goToPage(i: number) { this.pageIndex.set(i); }

  /* ============================================================
     Misc
     ============================================================ */
  bookStatus(b: BookVM) { return b.isAvailable ? 'Disponible' : 'Indisponible'; }
}
