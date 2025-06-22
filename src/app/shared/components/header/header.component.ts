import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import {CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements AfterViewInit {
  isMenuOpen = false;

  @ViewChild('menuToggleButton') menuToggleButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('drawerFirstLink') drawerFirstLink!: ElementRef<HTMLAnchorElement>;

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    if (this.isMenuOpen) {
      setTimeout(() => this.drawerFirstLink.nativeElement.focus(), 0);
    } else {
      setTimeout(() => this.menuToggleButton.nativeElement.focus(), 0);
    }
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    setTimeout(() => this.menuToggleButton.nativeElement.focus(), 0);
  }

  isActivePage(page: string): boolean {
    return window.location.pathname.includes(page);
  }
  
  ngAfterViewInit() {
    if (!this.isMenuOpen) {
      this.menuToggleButton.nativeElement.focus();
    }
  }
  handleKeyDown(event: KeyboardEvent) {
    if (!this.isMenuOpen) return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);

    switch (event.key) {
      case 'Tab':
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.closeMenu();
        break;
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const drawer = document.querySelector('.header__drawer');
    if (!drawer) return [];

    const elements = drawer.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    return Array.from(elements).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
  }
}
