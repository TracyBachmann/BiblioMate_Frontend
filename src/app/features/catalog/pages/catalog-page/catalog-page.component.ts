import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BookService, Book } from '../../../../core/services/book.service';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';

type Filters = {
  isbn: string;
  author: string;
  genre: string;
  publisher: string;
  date: string;
  tags: string;
  availableNow: boolean;
  exclude: string;
};

@Component({
  standalone: true,
  selector: 'app-catalog-page',
  imports: [CommonModule, FormsModule, NgOptimizedImage, SectionTitleComponent, BookCardComponent],
  templateUrl: './catalog-page.component.html',
  styleUrls: ['./catalog-page.component.scss'],
})
export class CatalogPageComponent implements OnInit {
  // Recherche simple + toggle avancé
  query = signal<string>('');
  advanced = signal<boolean>(false);

  // Filtres avancés
  filters = signal<Filters>({
    isbn: '',
    author: '',
    genre: '',
    publisher: '',
    date: '',
    tags: '',
    availableNow: false,
    exclude: '',
  });

  // Données
  nouveautes = signal<Book[]>([]);
  results = signal<Book[]>([]);

  // Carrousel "Nouveautés"
  readonly pageSize = 3;
  index = signal(0);
  canPrev = computed(() => this.index() > 0);
  canNext = computed(() => this.index() + this.pageSize < this.nouveautes().length);
  visibleNouveautes = computed(() =>
    this.nouveautes().slice(this.index(), this.index() + this.pageSize)
  );

  constructor(private booksApi: BookService) {}

  ngOnInit(): void {
    // Charge les nouveautés (au moins 9 pour 3 pages)
    this.booksApi.getLatest(9).subscribe(items => {
      this.nouveautes.set(items);
      this.index.set(0);
    });

    // Résultats (temporaire) — à remplacer par ton endpoint de recherche
    this.booksApi.getLatest(24).subscribe(items => this.results.set(items));
  }

  prev(): void {
    if (this.canPrev()) this.index.update(i => Math.max(0, i - this.pageSize));
  }
  next(): void {
    if (this.canNext()) {
      const maxStart = Math.max(0, this.nouveautes().length - this.pageSize);
      this.index.update(i => Math.min(maxStart, i + this.pageSize));
    }
  }

  onFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  resetFilters(): void {
    this.filters.set({
      isbn: '',
      author: '',
      genre: '',
      publisher: '',
      date: '',
      tags: '',
      availableNow: false,
      exclude: '',
    });
  }

  searchWithFilters(): void {
    // TODO: appeler ton endpoint de recherche avec this.query() et this.filters()
    // this.booksApi.search({...}).subscribe(res => this.results.set(res.items));
  }

  bookStatus(b: Book) {
    return b.isAvailable ? 'Disponible' : 'Indisponible';
  }
}
