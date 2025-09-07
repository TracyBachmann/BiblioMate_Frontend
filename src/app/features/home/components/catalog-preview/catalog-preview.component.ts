import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { CtaButtonComponent } from '../../../../shared/components/cta-button/cta-button.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';

/** View-model for what this preview needs. */
type BookLike = {
  id?: string | number;      // sometimes you had bookId
  bookId?: string | number;
  title: string;
  coverUrl?: string | null;
  description?: string | null;
};

@Component({
  selector: 'app-catalog-preview',
  standalone: true,
  imports: [CommonModule, RouterModule, SectionTitleComponent, CtaButtonComponent, BookCardComponent],
  templateUrl: './catalog-preview.component.html',
  styleUrls: ['./catalog-preview.component.scss']
})
export class CatalogPreviewComponent {
  /** Supply books with at least title (+ optionally coverUrl, description, id/bookId). */
  @Input({ required: true }) books: BookLike[] = [];
}
