import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { CtaButtonComponent } from '../../../../shared/components/cta-button/cta-button.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';

/**
 * Lightweight view-model interface for book-like data.
 * Used by this component to render a preview grid.
 */
type BookLike = {
  id?: string | number;       // some APIs use "id"
  bookId?: string | number;   // some APIs use "bookId"
  title: string;              // mandatory: book title
  coverUrl?: string | null;   // optional: cover image URL
  description?: string | null;// optional: short description
};

@Component({
  selector: 'app-catalog-preview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SectionTitleComponent,
    CtaButtonComponent,
    BookCardComponent
  ],
  templateUrl: './catalog-preview.component.html',
  styleUrls: ['./catalog-preview.component.scss']
})
export class CatalogPreviewComponent {
  /**
   * Input list of books to display in the preview section.
   * - Must contain at least a title.
   * - Optionally provides a coverUrl, description, and id/bookId.
   *
   * Example usage:
   * ```html
   * <app-catalog-preview [books]="latestBooks"></app-catalog-preview>
   * ```
   */
  @Input({ required: true }) books: BookLike[] = [];
}
