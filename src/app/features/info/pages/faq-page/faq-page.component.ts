import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';

type Faq = { q: string; a: string; open?: boolean };

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent, SectionTitleComponent],
  templateUrl: './faq-page.component.html',
  styleUrls: ['./faq-page.component.scss']
})
export class FaqPageComponent {
  faqs = signal<Faq[]>([
    { q: 'Comment obtenir une carte d’adhérent ?', a: 'L’inscription se fait sur place ou en ligne. Une pièce d’identité et un justificatif de domicile peuvent être demandés.' },
    { q: 'Puis-je réserver un livre indisponible ?', a: 'Oui. Depuis la fiche du livre, cliquez sur “Réserver”. Vous serez notifié dès qu’il est de retour.' },
    { q: 'Quels sont les horaires ?', a: 'Du mardi au samedi, 9h–18h (horaires élargis lors des événements).' },
    { q: 'Existe-t-il des activités jeunesse ?', a: 'Oui, ateliers et heure du conte chaque semaine. Le programme est publié dans la rubrique Événements.' },
  ]);

  toggle(i: number): void {
    const current = this.faqs();
    const next = current.map((item, idx) =>
      idx === i ? { ...item, open: !item.open } : item
    );
    this.faqs.set(next);
  }
}
