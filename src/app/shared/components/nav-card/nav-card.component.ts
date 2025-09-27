import { Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-card',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './nav-card.component.html',
  styleUrls: ['./nav-card.component.scss'],
})
export class NavCardComponent {
  /**
   * Main title displayed in the card footer.
   * Required field.
   */
  @Input() title!: string;

  /**
   * Optional subtitle displayed below the title.
   * Hidden if not provided.
   */
  @Input() subtitle?: string;

  /**
   * Path or URL to the image displayed at the top of the card.
   * Required field.
   */
  @Input() image!: string;

  /**
   * Router link used for navigation when the card is clicked.
   * Can be a string path or an Angular route array.
   */
  @Input() link: string | any[] = [];

  /**
   * Accessible label used by screen readers.
   * Falls back to the `title` if not provided.
   */
  @Input() ariaLabel?: string;

  /**
   * Disabled state.
   * When true, the card is visually dimmed, navigation is disabled,
   * and `aria-disabled="true"` is applied.
   */
  @Input() disabled = false;
}
