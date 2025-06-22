import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

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

  navIcons = [
    { class: 'search', src: 'assets/images/icon-search.svg', alt: 'Recherche', href: '#' },
    { class: 'contact', src: 'assets/images/icon-contact.svg', alt: 'Contact', href: '#' },
    { class: 'user', src: 'assets/images/icon-user.svg', alt: 'Mon compte', href: '#' }
  ];

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;

    setTimeout(() => {
      if (this.isMenuOpen) {
        this.drawerFirstLink.nativeElement.focus();
      } else {
        this.menuToggleButton.nativeElement.focus();
      }
    }, 0);
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

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const current = document.activeElement as HTMLElement;

    switch (event.key) {
      case 'Tab':
        if (event.shiftKey && current === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && current === last) {
          event.preventDefault();
          first.focus();
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
