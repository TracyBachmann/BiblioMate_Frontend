import {
  Component, ElementRef, ViewChild, AfterViewInit, OnInit, inject, signal
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { BookService } from '../../../core/services/book.service';

/**
 * Filters type
 * ------------------------
 * Represents the state of advanced filters in the search drawer.
 * Matches the query params structure used in the catalog.
 */
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

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements AfterViewInit, OnInit {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  auth = inject(AuthService);
  private booksApi = inject(BookService);

  // ===========================
  // State: Side menu
  // ===========================
  isMenuOpen = false;
  @ViewChild('menuToggleButton') menuToggleButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('drawerFirstLink') drawerFirstLink!: ElementRef<HTMLAnchorElement>;

  // ===========================
  // State: Search drawer
  // ===========================
  isSearchOpen = false;

  // ===========================
  // State: Search (signals)
  // - query, advanced toggle, filters, genres
  // ===========================
  query = signal<string>('');
  advanced = signal<boolean>(false);
  filters = signal<Filters>({
    isbn: '', author: '', genre: '', publisher: '', date: '',
    tags: '', availableNow: false, exclude: ''
  });
  genres = signal<string[]>([]);

  // ===========================
  // Lifecycle
  // ===========================
  ngOnInit(): void {
    // Load available genres from API
    this.booksApi.getGenres().subscribe({
      next: list => this.genres.set(list ?? []),
      error: () => this.genres.set([]),
    });

    // Keep header state in sync with URL query params
    const sync = () => {
      let r = this.route;
      while (r.firstChild) r = r.firstChild;
      this.applyParams(r.snapshot.queryParamMap);
    };
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(sync);
    sync(); // run initial sync
  }

  // ===========================
  // Menu handling
  // ===========================
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    setTimeout(() => {
      (this.isMenuOpen ? this.drawerFirstLink : this.menuToggleButton).nativeElement.focus();
    });
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    setTimeout(() => this.menuToggleButton.nativeElement.focus());
  }

  isActive(url: string): boolean {
    return this.router.url.startsWith(url);
  }

  ngAfterViewInit() {
    if (!this.isMenuOpen) this.menuToggleButton.nativeElement.focus();
  }

  /** Keyboard accessibility: trap focus and close with Escape */
  handleKeyDown(event: KeyboardEvent) {
    if (!this.isMenuOpen) return;
    const els = this.getFocusable('.header__drawer');
    if (!els.length) return;

    const [first, last] = [els[0], els[els.length - 1]];
    const current = document.activeElement as HTMLElement;

    if (event.key === 'Tab' && event.shiftKey && current === first) {
      event.preventDefault();
      last.focus();
    } else if (event.key === 'Tab' && !event.shiftKey && current === last) {
      event.preventDefault();
      first.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu();
    }
  }

  /** Utility: find all focusable elements inside a selector */
  private getFocusable(selector: string): HTMLElement[] {
    const root = document.querySelector(selector);
    if (!root) return [];
    return Array.from(root.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
  }

  // ===========================
  // Search drawer handling
  // ===========================
  toggleSearch(): void { this.isSearchOpen = !this.isSearchOpen; }
  closeSearch(): void { this.isSearchOpen = false; }

  /** Keyboard accessibility: close on Escape */
  handleSearchKeyDown(e: KeyboardEvent) {
    if (!this.isSearchOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closeSearch();
    }
  }

  // ===========================
  // Search state updates
  // ===========================
  onQueryChange(v: string) { this.query.set(v); }
  setAdvanced(checked: boolean) { this.advanced.set(checked); }
  onFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  /** Reset search state (query, filters, advanced toggle) without navigation */
  resetAll(): void {
    this.query.set('');
    this.advanced.set(false);
    this.filters.set({
      isbn: '', author: '', genre: '', publisher: '', date: '',
      tags: '', availableNow: false, exclude: ''
    });
  }

  /** Build query params object for explicit search navigation */
  private buildQueryParams(): Record<string, string> {
    const f = this.filters();
    const qp: Record<string, string> = {};

    if (this.query().trim()) qp['q'] = this.query().trim();
    if (this.advanced()) qp['adv'] = '1';

    if (f.isbn.trim()) qp['isbn'] = f.isbn.trim();
    if (f.author.trim()) qp['author'] = f.author.trim();
    if (f.genre.trim()) qp['genre'] = f.genre.trim();
    if (f.publisher.trim()) qp['publisher'] = f.publisher.trim();
    if (f.date) qp['date'] = f.date;
    if (f.tags.trim()) qp['tags'] = f.tags.trim();
    if (f.availableNow) qp['available'] = '1';
    if (f.exclude.trim()) qp['exclude'] = f.exclude.trim();

    return qp;
  }

  /** Trigger explicit search navigation (loupe, Enter, form submit) */
  applyNow(): void {
    const queryParams = this.buildQueryParams();
    this.router.navigate(['/catalogue'], { queryParams });
    // this.closeSearch(); // uncomment if you want to auto-close search drawer
  }

  // ===========================
  // URL -> state sync
  // ===========================
  private applyParams(params: ParamMap) {
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
}

