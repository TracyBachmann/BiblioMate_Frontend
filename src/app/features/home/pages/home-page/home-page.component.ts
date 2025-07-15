import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../components/hero/hero.component';
import { LibraryInfoSectionComponent } from '../../components/library-info-section/library-info-section.component';
import { TeamPresentationComponent } from '../../components/team-presentation/team-presentation.component';
import { CatalogPreviewComponent } from '../../components/catalog-preview/catalog-preview.component';

import { BookService, Book } from '../../../../core/services/book.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    LibraryInfoSectionComponent,
    TeamPresentationComponent,
    CatalogPreviewComponent
  ],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {
  latestBooks: Book[] = [];

  constructor(private bookService: BookService) {}

  ngOnInit(): void {
    this.bookService.getLatest(3)
      .subscribe(
        (books: Book[]) => {
          this.latestBooks = books;
        },
        err => console.error('Erreur chargement livres :', err)
      );
  }
}
