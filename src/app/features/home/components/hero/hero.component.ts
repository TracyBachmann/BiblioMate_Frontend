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
  isCtaOpen = false;
  isMobile = false;

  constructor(public auth: AuthService) {
    this.updateDeviceType();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.updateDeviceType();
  }

  private updateDeviceType(): void {
    this.isMobile = window.innerWidth <= 600;
  }

  toggleCta(): void {
    this.isCtaOpen = !this.isCtaOpen;
  }

  get chevronDirection(): string {
    return this.isCtaOpen
      ? 'assets/images/icon-chevron-left.svg'
      : 'assets/images/icon-chevron.svg';
  }
}
