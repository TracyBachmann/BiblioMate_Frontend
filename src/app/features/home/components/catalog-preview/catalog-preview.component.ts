import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Book } from '../../../../core/services/book.service';

import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { CtaButtonComponent } from '../../../../shared/components/cta-button/cta-button.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';

@Component({
  selector: 'app-catalog-preview',
  standalone: true,
  imports: [
    CommonModule,
    SectionTitleComponent,
    CtaButtonComponent,
    BookCardComponent
  ],
  templateUrl: './catalog-preview.component.html',
  styleUrls: ['./catalog-preview.component.scss']
})
export class CatalogPreviewComponent {
  @Input() books: Book[] = [];
}