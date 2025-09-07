import { Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-book-card',
  standalone: true,
  templateUrl: './book-card.component.html',
  styleUrls: ['./book-card.component.scss'],
  imports: [CommonModule, NgOptimizedImage, RouterModule],
})
export class BookCardComponent {
  @Input() title!: string;
  @Input() description = '';
  @Input() showStatus = false;
  @Input() status: 'Disponible' | 'Indisponible' | 'Réservé' = 'Disponible';
  @Input() compact = false;

  /** Id du livre recommandé pour routerLink */
  @Input() bookId?: string | number;

  /** Compat : si tu passes encore une URL (ex: "/livre/42") on l’utilise. */
  @Input() link?: string;

  private _image: string | null = null;
  @Input() set image(v: string | null | undefined) { this._image = v ?? null; }
  get image(): string | null { return this._image; }

  /** Toujours un lien Angular valide, ou null si on ne peut pas. */
  get routerLinkCmd(): string | any[] | null {
    // 1) cas moderne : ID
    if (this.bookId !== undefined && this.bookId !== null && this.bookId !== '') {
      return ['/livre', this.bookId];
    }
    // 2) compat : string '/livre/42' passée depuis l’extérieur
    if (this.link && this.link.startsWith('/')) {
      return this.link; // string OK pour routerLink
    }
    // 3) rien -> pas de navigation
    return null;
  }
}
