import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BookService, Book, BookSearchDto } from '../../../../core/services/book.service';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';

/** Structure of advanced filters */
interface Filters {
  isbn: string;
  author: string;
  genre: string;
  publisher: string;
  date: string;        // formatted as yyyy-MM-dd
  tags: string;        // comma-separated string "tag1, tag2"
  availableNow: boolean;
  exclude: string;
}

/** Lightweight ViewModel used in template & cards */
interface BookVM {
  id: string | number;
  title: string;
  coverUrl: string | null;
  description: string;
  isAvailable: boolean;
}

@Component({
  standalone: true,
  selector: 'app-catalog-page',
  imports: [CommonModule, FormsModule, NgOptimizedImage, SectionTitleComponent, BookCardComponent],
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.scss'],
})
export class CatalogPageComponent implements OnInit, OnDestroy {
  // --- Angular services
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  constructor(private booksApi: BookService) {}

  // --- Basic search & toggle for advanced filters
  query = signal<string>('');       // free-text query
  advanced = signal<boolean>(false); // show/hide advanced form

  // --- Advanced filters state
  filters = signal<Filters>({
    isbn: '', author: '', genre: '', publisher: '', date: '',
    tags: '', availableNow: false, exclude: '',
  });

  // --- Dynamic genres (from API)
  genres = signal<string[]>([]);

  // --- Results and "new arrivals" list (mapped into BookVM for the template)
  nouveautes = signal<BookVM[]>([]);
  results    = signal<BookVM[]>([]);

  // --- View switch (grid | list)
  viewMode = signal<'grid' | 'list'>('grid');

  // --- Carousel state (for "new arrivals")
  readonly pageSize = 3; // number of cards visible at once
  index = signal(0);     // current slice index

  /** Compute currently visible items in the carousel */
  visibleNouveautes = computed(() => {
    const start = this.index();
    const end = start + this.pageSize;
    return this.nouveautes().slice(start, end);
  });

  // --- Autoplay carousel
  private autoplayId: any = null;
  private autoplayDelay = 3500; // ms
  autoplayPaused = signal(false); // paused by hover/focus

  // --- Debounce for auto-search
  private searchDebounceId: any = null;
  private readonly searchDebounceMs = 350;

  // --- Reactive effect: whenever query or filters change, schedule a search
  private autoSearchEffect = effect(() => {
    this.query();
    this.filters();
    this.scheduleSearch();
  });

  // ===== Lifecycle =====
  ngOnInit(): void {
    // Fetch "latest books" (used in carousel)
    this.booksApi.getLatest(9).subscribe(items => {
      this.nouveautes.set(items.map(this.toVM));
      this.index.set(0);
      this.startAutoplay();
    });

    // Fetch genres list (used in filters dropdown)
    this.booksApi.getGenres().subscribe({
      next: list => this.genres.set(list ?? []),
      error: () => this.genres.set([]),
    });

    // Sync initial state from URL query parameters
    this.route.queryParamMap.subscribe(params => {
      this.syncFromQueryParams(params);
      // effect() above will handle triggering search
    });
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  // ===== Mapping: Book -> BookVM =====
  private toVM = (b: Book): BookVM => {
    const anyb = b as any; // for compatibility with backend variations
    const id = (anyb.id ?? anyb.bookId ?? anyb.book_id) as string | number;
    return {
      id,
      title: anyb.title ?? '',
      coverUrl: (anyb.coverUrl ?? anyb.cover_url ?? null) as string | null,
      description: (anyb.description ?? anyb.desc ?? '') as string,
      isAvailable: !!(anyb.isAvailable ?? anyb.available ?? false),
    };
  };

  // ===== Sync from URL =====
  private syncFromQueryParams(params: import('@angular/router').ParamMap) {
    const qp = (k: string) => params.get(k) ?? '';
    this.query.set(qp('q'));
    this.advanced.set(params.has('adv'));
    this.filters.set({
      isbn: qp('isbn'),
      author: qp('author'),
      genre: qp('genre'),
      publisher: qp('publisher'),
      date: qp('date'),
      tags: qp('tags'),
      availableNow: params.get('available') === '1',
      exclude: qp('exclude'),
    });
  }

  // ===== Carousel controls =====
  next(): void {
    const len = this.nouveautes().length;
    if (len <= this.pageSize) {return;} // nothing to slide
    const nextStart = this.index() + this.pageSize;
    this.index.set(nextStart >= len ? 0 : nextStart);
  }

  prev(): void {
    const len = this.nouveautes().length;
    if (len <= this.pageSize) {return;}
    const prevStart = this.index() - this.pageSize;
    this.index.set(prevStart < 0 ? Math.max(0, len - this.pageSize) : prevStart);
  }

  startAutoplay(): void {
    this.stopAutoplay();
    const len = this.nouveautes().length;
    if (len <= this.pageSize) {return;}
    this.autoplayId = setInterval(() => {
      if (!this.autoplayPaused()) {this.next();}
    }, this.autoplayDelay);
  }

  stopAutoplay(): void {
    if (this.autoplayId) {
      clearInterval(this.autoplayId);
      this.autoplayId = null;
    }
  }

  pauseAutoplay(flag: boolean) {
    this.autoplayPaused.set(flag);
  }

  // ===== Filters handlers =====
  onFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  resetAll(): void {
    this.query.set('');
    this.advanced.set(false);
    this.filters.set({
      isbn: '', author: '', genre: '', publisher: '', date: '',
      tags: '', availableNow: false, exclude: '',
    });

    // Clean URL params (syncs header too)
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  // ===== Search logic =====
  /** Schedule a search with debounce */
  private scheduleSearch(): void {
    if (this.searchDebounceId) {clearTimeout(this.searchDebounceId);}
    this.searchDebounceId = setTimeout(() => this.searchWithFilters(), this.searchDebounceMs);
  }

  /** Build DTO sent to backend */
  private buildSearchDto(): BookSearchDto {
    const f = this.filters();
    const q = this.query().trim();

    const dto: BookSearchDto = {};
    if (q) { dto.title = q; dto.description = q; }
    if (f.isbn.trim()) {dto.isbn = f.isbn.trim();}
    if (f.author.trim()) {dto.author = f.author.trim();}
    if (f.genre.trim()) {dto.genre = f.genre.trim();}
    if (f.publisher.trim()) {dto.publisher = f.publisher.trim();}

    if (f.date) {
      const y = new Date(f.date).getFullYear();
      dto.yearMin = y;
      dto.yearMax = y;
    }

    if (f.availableNow) {dto.isAvailable = true;}
    if (f.tags.trim()) {dto.tagNames = f.tags.split(',').map(s => s.trim()).filter(Boolean);}
    if (f.exclude.trim()) {dto.exclude = f.exclude.trim();}

    return dto;
  }

  /** Run the search (called by debounce or explicitly by the template) */
  public searchWithFilters(): void {
    const dto = this.buildSearchDto();

    // If no criteria at all → fallback: just load latest books
    const hasAny = Object.entries(dto).some(([_, v]) =>
      Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== ''
    );

    if (!hasAny) {
      this.booksApi.getLatest(24).subscribe(items => this.results.set(items.map(this.toVM)));
      return;
    }

    // Otherwise: run search API
    this.booksApi.search(dto).subscribe({
      next: items => this.results.set(items.map(this.toVM)),
      error: err => {
        console.error('Search API failed, fallback to GET:', err);
        this.booksApi.getLatest(24).subscribe(items => this.results.set(items.map(this.toVM)));
      }
    });
  }

  /** Simple status helper (Disponible / Indisponible) */
  bookStatus(b: BookVM) {
    return b.isAvailable ? 'Disponible' : 'Indisponible';
  }
}
