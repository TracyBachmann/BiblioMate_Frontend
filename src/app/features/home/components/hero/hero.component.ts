import { Component, HostListener } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.scss']
})
export class HeroComponent {
  /** Controls the state of the CTA dropdown */
  isCtaOpen = false;

  /** Tracks whether the current device is "mobile" (≤ 600px wide) */
  isMobile = false;

  constructor(public auth: AuthService) {
    // On component init, detect device type once
    this.updateDeviceType();
  }

  /** Listen for window resize events to update mobile/desktop state */
  @HostListener('window:resize')
  onResize(): void {
    this.updateDeviceType();
  }

  /** Update the `isMobile` flag depending on window width */
  private updateDeviceType(): void {
    this.isMobile = window.innerWidth <= 600;
  }

  /** Toggle CTA dropdown visibility */
  toggleCta(): void {
    this.isCtaOpen = !this.isCtaOpen;
  }

  /**
   * Returns the correct chevron icon path depending on CTA state.
   * - Closed: default right/down chevron
   * - Open: rotated left/up chevron
   */
  get chevronDirection(): string {
    return this.isCtaOpen
      ? 'assets/images/icon-chevron-left.svg'
      : 'assets/images/icon-chevron.svg';
  }
}
