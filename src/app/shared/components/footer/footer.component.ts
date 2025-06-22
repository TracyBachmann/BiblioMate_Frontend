import { Component } from "@angular/core";
import {CommonModule, NgOptimizedImage } from '@angular/common';

type FooterLink = { label: string; href: string };
type FooterSocialLink = FooterLink & { icon: string };

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
})
export class FooterComponent {
  openSections: Record<string, boolean> = {};

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
        { label: 'À propos', href: '#' },
        { label: 'Contact', href: '#' },
        { label: 'Foire aux questions', href: '#' },
        { label: 'Mentions légales', href: '#' }
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

  toggleSection(id: string): void {
    this.openSections[id] = !this.openSections[id];
  }

  isSectionOpen(id: string): boolean {
    return this.openSections[id];
  }

  isSocialLink(link: FooterLink | FooterSocialLink): link is FooterSocialLink {
    return 'icon' in link;
  }
}
