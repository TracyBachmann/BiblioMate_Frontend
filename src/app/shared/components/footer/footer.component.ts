import { Component } from "@angular/core";
import { CommonModule, NgOptimizedImage } from '@angular/common';

/**
 * Basic footer link.
 * Represents a simple navigation link with label and href.
 */
interface FooterLink {
  /** Visible text for the link */
  label: string;
  /** Target URL for the link */
  href: string;
}

/**
 * Social link with an icon.
 * Extends FooterLink by adding an icon path.
 */
type FooterSocialLink = FooterLink & {
  /** Path to the social network icon */
  icon: string;
};

/**
 * FooterComponent
 * -----------------
 * Standalone Angular component that renders the site footer.
 * Features:
 * - Displays official information links
 * - Displays social links with icons
 * - Supports collapsible sections (accordion style) for small screens
 * - Provides accessible roles and ARIA attributes
 */
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
})
export class FooterComponent {
  /**
   * State object tracking which footer sections are expanded.
   * Keys correspond to section IDs, values are booleans.
   */
  openSections: Record<string, boolean> = {};

  /**
   * Array of footer sections.
   * Each section contains:
   * - unique id
   * - display title
   * - CSS class
   * - list of links (standard or social)
   */
  footerSections: {
    id: string;
    title: string;
    class: string;
    links: (FooterLink | FooterSocialLink)[];
  }[] = [
    {
      id: 'infos',
      title: 'Informations officielles',
      class: 'footer__info',
      links: [
        { label: 'À propos',          href: '/a-propos' },
        { label: 'Contact',           href: '/contact' },
        { label: 'Foire aux questions', href: '/faq' },
        { label: 'Mentions légales',  href: '/mentions-legales' }
      ]
    },
    {
      id: 'socials',
      title: 'Réseaux sociaux',
      class: 'footer__socials',
      links: [
        { label: 'Instagram', href: '#', icon: 'assets/images/instagram.svg' },
        { label: 'Facebook', href: '#', icon: 'assets/images/facebook.svg' },
        { label: 'Twitter', href: '#', icon: 'assets/images/twitter.svg' },
        { label: 'LinkedIn', href: '#', icon: 'assets/images/linkedin.svg' },
        { label: 'Pinterest', href: '#', icon: 'assets/images/pinterest.svg' },
        { label: 'YouTube', href: '#', icon: 'assets/images/youtube.svg' }
      ]
    }
  ];

  /**
   * Toggles the open/closed state of a footer section.
   * @param id Section identifier
   */
  toggleSection(id: string): void {
    this.openSections[id] = !this.openSections[id];
  }

  /**
   * Checks whether a footer section is currently open.
   * @param id Section identifier
   * @returns true if the section is open, false otherwise
   */
  isSectionOpen(id: string): boolean {
    return this.openSections[id];
  }

  /**
   * Type guard to check if a link is a social link.
   * @param link Footer link (basic or social)
   * @returns true if the link includes an icon property
   */
  isSocialLink(link: FooterLink | FooterSocialLink): link is FooterSocialLink {
    return 'icon' in link;
  }
}
