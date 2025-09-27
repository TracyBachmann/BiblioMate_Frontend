import { Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';

/**
 * CtaButtonComponent
 * ------------------
 * Standalone Angular component that renders a styled call-to-action button.
 *
 * Features:
 * - Displays a customizable text label
 * - Supports two color themes: yellow or blue
 * - Optional icon displayed before the label
 * - Supports Angular routerLink navigation for internal routing
 */
@Component({
  selector: 'app-cta-button',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterModule],
  templateUrl: './cta-button.component.html',
  styleUrls: ['./cta-button.component.scss']
})
export class CtaButtonComponent {
  /**
   * Button label text (required).
   * Appears as the visible caption inside the button.
   */
  @Input() text!: string;

  /**
   * Color theme for the button.
   * - "yellow": highlighted style
   * - "blue": primary style
   * Default: "yellow"
   */
  @Input() color: 'yellow' | 'blue' = 'yellow';

  /**
   * Optional icon name.
   * If provided, an icon image is displayed before the text.
   * Icon path is automatically resolved to `/assets/images/icon-{icon}.svg`.
   */
  @Input() icon?: string;

  /**
   * Router navigation target.
   * Accepts a string path or an array of commands compatible with Angular Router.
   * If undefined, the button behaves as a static element without navigation.
   */
  @Input() routerLink?: string | any[];
}
