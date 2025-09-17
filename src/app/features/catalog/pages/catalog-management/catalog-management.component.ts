import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';
import { BookService, Book } from '../../../../core/services/book.service';

type Filters = {
  isbn: string;
  author: string;
  genre: string;
  publisher: string;
  date: string;       // yyyy-MM-dd
  tags: string;
  availableNow: boolean;
  exclude: string;
};


type BookVM = {
  id: string;            // toujours string
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
  query = signal<string>('');
  advanced = signal<boolean>(false);

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

  results = signal<BookVM[]>([]);

  // Pagination
  pageSize = 6;
  pageIndex = signal(0);
  totalPages = computed(() => {
    const n = Math.ceil(this.results().length / this.pageSize);
    return Array.from({ length: n }, (_, i) => i);
  });

  pagedResults = computed(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.results().slice(start, start + this.pageSize);
  });

  constructor(private booksApi: BookService) {}

  genres = signal<string[]>([]);

  ngOnInit(): void {
    this.booksApi.getGenres().subscribe({
      next: list => this.genres.set(list ?? []),
      error: () => this.genres.set([]),
    });

    this.search();
  }

  /** Normalisation Book -> BookVM */
  private toVM(b: Book): BookVM {
    const anyb = b as any;
    const rawId = anyb.id ?? anyb.bookId ?? anyb.book_id ?? '';
    return {
      id: String(rawId), // force en string
      title: anyb.title ?? '',
      coverUrl: anyb.coverUrl ?? anyb.cover_url ?? '',
      description: anyb.description ?? '',
      isAvailable: !!(anyb.isAvailable ?? anyb.available ?? false),
    };
  }

  search(): void {
    const dto: any = {};
    if (this.query().trim()) dto.title = this.query().trim();

    const f = this.filters();

    if (f.isbn.trim()) dto.isbn = f.isbn.trim();
    if (f.author.trim()) dto.author = f.author.trim();
    if (f.genre.trim()) dto.genre = f.genre.trim();
    if (f.publisher.trim()) dto.publisher = f.publisher.trim();

    if (f.date) {
      const y = new Date(f.date).getFullYear();
      dto.yearMin = y;
      dto.yearMax = y;
    }

    if (f.availableNow) dto.isAvailable = true;
    if (f.tags.trim()) dto.tagNames = f.tags.split(',').map(s => s.trim()).filter(Boolean);
    if (f.exclude.trim()) dto.exclude = f.exclude.trim();

    this.booksApi.search(dto).subscribe(items => {
      this.results.set(items.map(this.toVM));
      this.pageIndex.set(0);
    });
  }

  onFilterChange<K extends keyof Filters>(key: K, value: Filters[K]) {
    this.filters.update(f => ({ ...f, [key]: value }));
  }

  resetFilters(): void {
    this.query.set('');
    this.filters.set({
      isbn: '',
      author: '',
      genre: '',
      publisher: '',
      date: '',
      tags: '',
      availableNow: false,
      exclude: ''
    });
    this.search();
  }

  onCSVSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = () => {
      const text = reader.result as string;
      const rows = text.split(/\r?\n/).filter(r => r.trim().length > 0);
      const header = rows[0].split(',').map(h => h.trim());

      const books = rows.slice(1).map(row => {
        const cols = row.split(',');
        const book: any = {};
        header.forEach((h, i) => {
          book[h] = cols[i] ? cols[i].trim() : '';
        });
        return book;
      });

      // Debug: affiche ce qu'on a importé
      console.log('Books from CSV:', books);

      // → Ici tu peux soit :
      // 1. les envoyer à ton API pour persister
      // 2. ou juste les ajouter à results localement
      this.results.update(list => [...list, ...books.map(this.toVM)]);
    };

    reader.readAsText(file);
  }

  exportCSV(): void {
    const books = this.results(); // ou this.pagedResults() si tu veux seulement la page visible
    if (!books.length) {
      alert('Aucun livre à exporter.');
      return;
    }

    // Crée les en-têtes CSV
    const headers = Object.keys(books[0]);
    const rows = [
      headers.join(','), // première ligne = colonnes
      ...books.map(b => headers.map(h => JSON.stringify((b as any)[h] ?? '')).join(','))
    ];

    const csvContent = rows.join('\n');

    // Blob pour téléchargement
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'catalogue.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  createBook(): void { console.log('Ajouter un livre'); }
  importCSV(): void { console.log('Importer un CSV'); }

  editBook(id: string): void { console.log('Modifier livre', id); }
  deleteBook(id: string): void {
    if (confirm('Supprimer ce livre ?')) {
      this.results.update(list => list.filter(b => b.id !== id));
    }
  }

  nextPage() {
    if (this.pageIndex() < this.totalPages().length - 1) {
      this.pageIndex.update(i => i + 1);
    }
  }

  prevPage() {
    if (this.pageIndex() > 0) {
      this.pageIndex.update(i => i - 1);
    }
  }

  goToPage(i: number) { this.pageIndex.set(i); }

  bookStatus(b: BookVM) {
    return b.isAvailable ? 'Disponible' : 'Indisponible';
  }
}

