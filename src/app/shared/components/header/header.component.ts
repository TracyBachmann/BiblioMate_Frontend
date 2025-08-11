import { Component, ElementRef, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements AfterViewInit {
  private router = inject(Router);
  auth = inject(AuthService); // expose isAuthenticated$, role$, logout()

  isMenuOpen = false;

  @ViewChild('menuToggleButton') menuToggleButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('drawerFirstLink') drawerFirstLink!: ElementRef<HTMLAnchorElement>;

  navIcons = [
    { class: 'search',  src: 'assets/images/icon-search.svg',  alt: 'Recherche',  link: '/recherche' },
    { class: 'contact', src: 'assets/images/icon-contact.svg', alt: 'Contact',    link: '/contact'   },
    // destination dynamique dans le template via [routerLink]
  ];

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    setTimeout(() => {
      (this.isMenuOpen ? this.drawerFirstLink : this.menuToggleButton).nativeElement.focus();
    });
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    setTimeout(() => this.menuToggleButton.nativeElement.focus());
  }

  isActive(url: string): boolean { return this.router.url.startsWith(url); }

  ngAfterViewInit() {
    if (!this.isMenuOpen) this.menuToggleButton.nativeElement.focus();
  }

  handleKeyDown(event: KeyboardEvent) {
    if (!this.isMenuOpen) return;
    const els = this.getFocusableElements();
    if (!els.length) return;

    const first = els[0];
    const last  = els[els.length - 1];
    const current = document.activeElement as HTMLElement;

    if (event.key === 'Tab' && event.shiftKey && current === first) { event.preventDefault(); last.focus(); }
    else if (event.key === 'Tab' && !event.shiftKey && current === last) { event.preventDefault(); first.focus(); }
    else if (event.key === 'Escape') { event.preventDefault(); this.closeMenu(); }
  }

  private getFocusableElements(): HTMLElement[] {
    const drawer = document.querySelector('.header__drawer');
    if (!drawer) return [];
    return Array.from(drawer.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hasAttribute('disabled') && el.tabIndex !== -1);
  }
}
