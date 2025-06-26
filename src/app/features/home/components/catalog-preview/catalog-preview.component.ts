import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../shared/section-title/section-title.component';
import { CtaButtonComponent } from '../shared/cta-button/cta-button.component';
import { BookCardComponent } from '../shared/book-card/book-card.component';

@Component({
  selector: 'app-catalog-preview',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent, CtaButtonComponent, BookCardComponent],
  templateUrl: './catalog-preview.component.html',
  styleUrls: ['./catalog-preview.component.scss'],
})
export class CatalogPreviewComponent {
  books = [
    {
      title: 'Titre du livre',
      cover: 'assets/images/mock-book-1.jpg',
      description: 'Quisque vel enim purus. Nullam pretium fringilla molestie […]',
      link: '#',
    },
    {
      title: 'Titre du livre',
      cover: 'assets/images/mock-book-2.jpg',
      description: 'Quisque vel enim purus. Nullam pretium fringilla molestie […]',
      link: '#',
    },
    {
      title: 'Titre du livre',
      cover: 'assets/images/mock-book-3.jpg',
      description: 'Quisque vel enim purus. Nullam pretium fringilla molestie […]',
      link: '#',
    },
  ];
}
