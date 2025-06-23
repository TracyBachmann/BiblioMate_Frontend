import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

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

  constructor() {
    this.updateDeviceType();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateDeviceType();
  }

  updateDeviceType() {
    this.isMobile = window.innerWidth <= 600;
  }

  toggleCta() {
    this.isCtaOpen = !this.isCtaOpen;
  }

  get chevronDirection(): string {
    return this.isCtaOpen ? 'assets/images/icon-chevron-left.svg' : 'assets/images/icon-chevron.svg';
  }
}
