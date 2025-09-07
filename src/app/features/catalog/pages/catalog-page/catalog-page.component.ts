import { Component, OnInit, OnDestroy, signal, computed, effect, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { BookService, Book, BookSearchDto } from '../../../../core/services/book.service';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';

type Filters = {
  isbn: string;
  author: string;
  genre: string;
  publisher: string;
  date: string;        // yyyy-MM-dd
  tags: string;        // "tag1, tag2"
  availableNow: boolean;
  exclude: string;
};

/** View-model used by the template & cards */
type BookVM = {
  id: string | number;
  title: string;
  coverUrl: string | null;
  description: string;
  isAvailable: boolean;
};

@Component({
  standalone: true,
  selector: 'app-catalog-page',
  imports: [CommonModule, FormsModule, NgOptimizedImage, SectionTitleComponent, BookCardComponent],
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.scss'],
})
export class CatalogPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  constructor(private booksApi: BookService) {}

  // Recherche simple + toggle avancé
  query = signal<string>('');
  advanced = signal<boolean>(false);

  // Filtres avancés
  filters = signal<Filters>({
    isbn: '', author: '', genre: '', publisher: '', date: '',
    tags: '', availableNow: false, exclude: '',
  });

  // Genres dynamiques
  genres = signal<string[]>([]);

  // Résultats + nouveautés (typed VM to satisfy the template)
  nouveautes = signal<BookVM[]>([]);
  results    = signal<BookVM[]>([]);

  // Vue (grille | liste)
  viewMode = signal<'grid' | 'list'>('grid');

  // Carrousel "Nouveautés"
  readonly pageSize = 3;
  index = signal(0);
  visibleNouveautes = computed(() => {
    const start = this.index();
    const end = start + this.pageSize;
    return this.nouveautes().slice(start, end);
  });

  // Autoplay
  private autoplayId: any = null;
  private autoplayDelay = 3500;
  autoplayPaused = signal(false);

  // Debounce recherche auto
  private searchDebounceId: any = null;
  private readonly searchDebounceMs = 350;

  // Effet auto-recherche
  private autoSearchEffect = effect(() => {
    this.query();
    this.filters();
    this.scheduleSearch();
  });

  ngOnInit(): void {
    // Nouveautés (map -> VM)
    this.booksApi.getLatest(9).subscribe(items => {
      this.nouveautes.set(items.map(this.toVM));
      this.index.set(0);
      this.startAutoplay();
    });

    // Genres
    this.booksApi.getGenres().subscribe({
      next: list => this.genres.set(list ?? []),
      error: () => this.genres.set([]),
    });

    // Sync depuis l'URL
    this.route.queryParamMap.subscribe(params => {
      this.syncFromQueryParams(params);
      // l'effect déclenchera scheduleSearch()
    });
  }

  ngOnDestroy(): void { this.stopAutoplay(); }

  // === Mapping Book -> BookVM ===
  private toVM = (b: Book): BookVM => {
    const anyb = b as any; // assure compatibility if Book doesn't expose all fields
    const id = (anyb.id ?? anyb.bookId ?? anyb.book_id) as string | number;
    return {
      id,
      title: anyb.title ?? '',
      coverUrl: (anyb.coverUrl ?? anyb.cover_url ?? null) as string | null,
      description: (anyb.description ?? anyb.desc ?? '') as string,
      isAvailable: !!(anyb.isAvailable ?? anyb.available ?? false),
    };
  };

  // === URL -> état ===
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

  // === Carrousel ===
  next(): void {
    const len = this.nouveautes().length;
    if (len <= this.pageSize) return;
    const nextStart = this.index() + this.pageSize;
    this.index.set(nextStart >= len ? 0 : nextStart);
  }
  prev(): void {
    const len = this.nouveautes().length;
    if (len <= this.pageSize) return;
    const prevStart = this.index() - this.pageSize;
    this.index.set(prevStart < 0 ? Math.max(0, len - this.pageSize) : prevStart);
  }
  startAutoplay(): void {
    this.stopAutoplay();
    const len = this.nouveautes().length;
    if (len <= this.pageSize) return;
    this.autoplayId = setInterval(() => {
      if (!this.autoplayPaused()) this.next();
    }, this.autoplayDelay);
  }
  stopAutoplay(): void { if (this.autoplayId) { clearInterval(this.autoplayId); this.autoplayId = null; } }
  pauseAutoplay(flag: boolean) { this.autoplayPaused.set(flag); }

  // === Filtres ===
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

    // Nettoie l’URL – le header se resynchronise aussi
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  private scheduleSearch(): void {
    if (this.searchDebounceId) clearTimeout(this.searchDebounceId);
    this.searchDebounceId = setTimeout(() => this.searchWithFilters(), this.searchDebounceMs);
  }

  private buildSearchDto(): BookSearchDto {
    const f = this.filters();
    const q = this.query().trim();

    const dto: BookSearchDto = {};
    if (q) { dto.title = q; dto.description = q; }
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

    return dto;
  }

  /** Lance la recherche (appelée par le debounce OU par le template) */
  public searchWithFilters(): void {
    const dto = this.buildSearchDto();

    const hasAny =
      Object.entries(dto).some(([_, v]) =>
        Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== ''
      );

    if (!hasAny) {
      this.booksApi.getLatest(24).subscribe(items => this.results.set(items.map(this.toVM)));
      return;
    }

    this.booksApi.search(dto).subscribe({
      next: items => this.results.set(items.map(this.toVM)),
      error: err => {
        console.error('Search API failed, fallback to GET:', err);
        this.booksApi.getLatest(24).subscribe(items => this.results.set(items.map(this.toVM)));
      }
    });
  }

  bookStatus(b: BookVM) {
    return b.isAvailable ? 'Disponible' : 'Indisponible';
  }
}
