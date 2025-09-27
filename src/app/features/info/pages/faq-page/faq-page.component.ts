/**
 * FaqPageComponent
 * -----------------------------------------------------------------------------
 * Purpose:
 * - Renders an FAQ page with expandable/collapsible questions and answers.
 *
 * Design:
 * - Angular Standalone Component: declares required module/component imports.
 * - Uses Angular Signals (`faqs`) for local reactive state; this avoids manual
 *   change detection and fits well with Angular's reactivity model.
 *
 * Data Model:
 * - `Faq`: a question/answer pair with an optional `open` flag indicating
 *   whether the answer is currently expanded.
 *
 * Behavior:
 * - `toggle(i)`: toggles the `open` state for the FAQ entry at index `i`
 *   using an immutable update (maps to a new array instance).
 *
 * Accessibility:
 * - In the template, prefer using button elements for toggles and reflect
 *   state via `aria-expanded` and `aria-controls` when applicable.
 *
 * Maintenance:
 * - Keep the initial `faqs` content localized to the target audience.
 * - For dynamic FAQs, replace the static array with data loaded from a service.
 * - This file adds documentation-only comments; no logic or signatures changed.
 */

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';

/**
 * Faq
 * Represents a single FAQ entry.
 * @property q - The question text.
 * @property a - The answer text.
 * @property open - Optional UI state; `true` means the answer is expanded.
 */
type Faq = { q: string; a: string; open?: boolean };

@Component({
  selector: 'app-faq-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent, SectionTitleComponent],
  templateUrl: './faq-page.component.html',
  styleUrls: ['./faq-page.component.scss']
})
export class FaqPageComponent {
  /**
   * Reactive list of FAQs displayed on the page.
   * Notes:
   * - Read current value with `this.faqs()`.
   * - Update with `this.faqs.set(nextValue)`.
   * - Initial state has all entries collapsed (`open` is undefined/false).
   */
  faqs = signal<Faq[]>([
    { q: 'Comment obtenir une carte d’adhérent ?', a: 'L’inscription se fait sur place ou en ligne. Une pièce d’identité et un justificatif de domicile peuvent être demandés.' },
    { q: 'Puis-je réserver un livre indisponible ?', a: 'Oui. Depuis la fiche du livre, cliquez sur “Réserver”. Vous serez notifié dès qu’il est de retour.' },
    { q: 'Quels sont les horaires ?', a: 'Du mardi au samedi, 9h–18h (horaires élargis lors des événements).' },
    { q: 'Existe-t-il des activités jeunesse ?', a: 'Oui, ateliers et heure du conte chaque semaine. Le programme est publié dans la rubrique Événements.' },
  ]);

  /**
   * Toggles the expanded/collapsed state of an FAQ entry by index.
   * @param i Index of the FAQ to toggle.
   * Implementation details:
   * - Uses an immutable update pattern: maps to a new array instance and
   *   clones the targeted item via spread to avoid mutating existing state.
   * - If `open` is undefined, `!item.open` treats it as `false -> true`.
   */
  toggle(i: number): void {
    const current = this.faqs();
    const next = current.map((item, idx) =>
      idx === i ? { ...item, open: !item.open } : item
    );
    this.faqs.set(next);
  }
}
