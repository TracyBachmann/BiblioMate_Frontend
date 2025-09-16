import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';
import { BookService, Book } from '../../../../core/services/book.service';

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
  results = signal<Book[]>([]);

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

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    this.booksApi.search({}).subscribe(items => {
      this.results.set(items);
      this.pageIndex.set(0);
    });
  }


  createBook(): void {
    // TODO: navigation vers page de création
    console.log('Ajouter un livre');
  }

  importCSV(): void {
    // TODO: ouvrir un file picker
    console.log('Importer un CSV');
  }

  editBook(id: string | number): void {
    console.log('Modifier livre', id);
  }

  deleteBook(id: string | number): void {
    if (confirm('Supprimer ce livre ?')) {
      // TODO: appel API suppression
      this.results.update(list => list.filter(b => (b as any).id !== id));
    }
  }

  nextPage() { if (this.pageIndex() < this.totalPages().length - 1) this.pageIndex.update(i => i + 1); }
  prevPage() { if (this.pageIndex() > 0) this.pageIndex.update(i => i - 1); }
  goToPage(i: number) { this.pageIndex.set(i); }

  bookStatus(b: Book) {
    return (b as any).isAvailable ? 'Disponible' : 'Indisponible';
  }
}
