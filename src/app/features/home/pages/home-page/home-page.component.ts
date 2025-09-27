/**
 * HomePageComponent
 * -----------------------------------------------------------------------------
 * Purpose:
 * - Renders the application's home page.
 * - Fetches and exposes a preview list of the most recent books for display
 *   (e.g., in `CatalogPreviewComponent`).
 *
 * Key Concepts:
 * - Angular Standalone Component with feature components imported locally.
 * - Uses `BookService` to retrieve the latest books on initialization.
 * - Stores the fetched results in `latestBooks` for template consumption.
 *
 * Data Flow:
 * - On `ngOnInit()`, calls `bookService.getLatest(3)` to load three recent books.
 * - Subscribes to the observable:
 *     • `next`: assigns the resulting array to `latestBooks`.
 *     • `error`: logs a descriptive message to the console.
 *
 * Notes for Maintainers:
 * - If `getLatest()` returns a finite (completing) observable (e.g., HttpClient),
 *   an explicit unsubscribe is not required. If switching to a long-lived stream,
 *   consider managing the subscription (e.g., `takeUntil` or `Subscription` cleanup).
 * - Keep the number argument of `getLatest(...)` aligned with the design of the
 *   home page preview (e.g., card grid capacity).
 * - This file contains documentation-only comments; no functional changes were made.
 */

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
  /**
   * Holds the list of latest books to be displayed on the home page.
   * Populated in `ngOnInit()` by the result of `BookService.getLatest(...)`.
   */
  latestBooks: Book[] = [];

  /**
   * Service dependency for retrieving book data.
   * @param bookService Data access layer for books (injected by Angular DI).
   */
  constructor(private bookService: BookService) {}

  /**
   * Lifecycle hook: component initialization.
   * Behavior:
   * - Requests the N most recent books (here, 3) from the `BookService`.
   * - Assigns the result to `latestBooks` on success.
   * - Logs a descriptive error message on failure.
   *
   * Error Handling:
   * - For production UX, consider surfacing a user-friendly message and/or a
   *   retry affordance in the template rather than only logging to console.
   */
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
