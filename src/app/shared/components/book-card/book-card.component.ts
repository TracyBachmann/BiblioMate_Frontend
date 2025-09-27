import { Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * BookCardComponent
 * -----------------
 * Standalone Angular component that displays a book card.
 * Supports:
 * - Title, description, image display
 * - Status (availability)
 * - Compact mode (list view vs. card view)
 * - Reservation and loan details with actions
 * - Navigation link to book details
 * - Management actions (edit, delete)
 */
@Component({
  selector: 'app-book-card',
  standalone: true,
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.scss'],
  imports: [CommonModule, NgOptimizedImage, RouterModule],
})
export class BookCardComponent {
  /** Book title (required) */
  @Input() title!: string;

  /** Book description (optional, defaults to empty string) */
  @Input() description = '';

  // ===== Book status =====
  /** Whether to show the status label */
  @Input() showStatus = false;
  /** Current status of the book */
  @Input() status: 'Disponible' | 'Indisponible' | 'Réservé' = 'Disponible';

  // ===== Layout options =====
  /** Compact display mode (list view) */
  @Input() compact = false;

  // ===== Reservation inputs =====
  /** Reservation date in format dd/MM/yyyy */
  @Input() reservationDate?: string;
  /** Expiration date in format dd/MM/yyyy */
  @Input() expirationDate?: string;
  /** Whether the reservation can be cancelled */
  @Input() cancellable = false;
  /** Label for the cancel button */
  @Input() cancelLabel = 'Annuler ma réservation';
  /** Callback executed when cancelling a reservation */
  @Input() cancelFn?: (id: string | number) => void;
  /** Reservation identifier (used when cancelling) */
  @Input() reservationId?: string | number;

  // ===== Loan inputs =====
  /** Loan date in format dd/MM/yyyy */
  @Input() loanDate?: string;
  /** Expected return date in format dd/MM/yyyy */
  @Input() returnDate?: string;
  /** Whether the loan can be extended */
  @Input() extendable = false;
  /** Label for the extend button */
  @Input() extendLabel = 'Prolonger l\'emprunt';
  /** Callback executed when extending a loan */
  @Input() extendFn?: (id: string | number) => void;
  /** Loan identifier (used when extending) */
  @Input() loanId?: string | number;

  // ===== Navigation =====
  /** Book identifier (used for routerLink generation) */
  @Input() bookId?: string | number;
  /** Direct navigation link (optional, must start with "/") */
  @Input() link?: string;

  // ===== Catalog management mode =====
  /** Enables edit/delete management buttons */
  @Input() manage = false;
  /** Edit callback function */
  @Input() editFn?: (id: string) => void;
  /** Delete callback function */
  @Input() deleteFn?: (id: string) => void;

  /**
   * Handles click on "Edit" button.
   * Calls editFn callback if management mode is enabled
   * and bookId is defined.
   */
  onEditClick() {
    if (this.manage && this.editFn && this.bookId != null) {
      this.editFn(String(this.bookId));
    }
  }

  /**
   * Handles click on "Delete" button.
   * Calls deleteFn callback if management mode is enabled
   * and bookId is defined.
   */
  onDeleteClick() {
    if (this.manage && this.deleteFn && this.bookId != null) {
      this.deleteFn(String(this.bookId));
    }
  }

  /**
   * Handles click on "Extend loan" button.
   * Calls extendFn callback if provided
   * and loanId is defined.
   */
  onExtendClick() {
    if (this.extendFn && this.loanId !== undefined) {
      this.extendFn(this.loanId);
    }
  }

  /**
   * Handles click on "Cancel reservation" button.
   * Calls cancelFn callback if provided
   * and reservationId is defined.
   */
  onCancelClick() {
    if (this.cancelFn && this.reservationId !== undefined) {
      this.cancelFn(this.reservationId);
    }
  }

  // ===== Image input with fallback =====
  private _image: string | null = null;

  /** Sets the book image (null if not provided) */
  @Input() set image(v: string | null | undefined) { this._image = v ?? null; }
  /** Returns the current image path or null */
  get image(): string | null { return this._image; }

  // ===== Router link generation =====
  /**
   * Returns a valid Angular router command if possible:
   * - ['/livre', bookId] if bookId is defined
   * - direct link if provided and starts with '/'
   * - null otherwise
   */
  get routerLinkCmd(): string | any[] | null {
    if (this.bookId !== undefined && this.bookId !== null && this.bookId !== '') {
      return ['/livre', this.bookId];
    }
    if (this.link && this.link.startsWith('/')) {
      return this.link; // string is valid for routerLink
    }
    return null;
  }
}

