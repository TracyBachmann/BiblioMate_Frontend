/**
 * ContactPageComponent
 * -----------------------------------------------------------------------------
 * Purpose:
 * - Renders a contact form with validation and submission feedback.
 * - Demonstrates Angular Reactive Forms combined with Signals for UI state.
 *
 * Key Concepts:
 * - Reactive Forms: `FormBuilder` constructs a strongly-typed `FormGroup`.
 * - Validators: required, max/min length, email format, and consent checkbox.
 * - Signals: `isSubmitting`, `success`, `error` hold transient UI state.
 * - UX: on invalid submit, marks all controls as touched and shows an error.
 *
 * Implementation Notes:
 * - `submit()` currently simulates an async API call via `setTimeout`.
 * - Replace the placeholder with a real HTTP request when integrating.
 * - After success: clears transient error, shows success, resets the form
 *   (keeps consent unchecked by default).
 *
 * Accessibility:
 * - Use `hasError(name)` in the template to conditionally render error messages
 *   and `aria-invalid`/`aria-describedby` bindings for each field.
 *
 * Maintenance:
 * - Keep the validation rules in sync with backend constraints.
 * - If adding fields, define validators here and update the template bindings.
 * - This file adds documentation comments only; no functional changes were made.
 */

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

// Shared components
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { CtaButtonComponent } from '../../../../shared/components/cta-button/cta-button.component';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [
    CommonModule, RouterModule, NgOptimizedImage,
    FormsModule, ReactiveFormsModule,
    HeaderComponent, FooterComponent, SectionTitleComponent, CtaButtonComponent
  ],
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.scss']
})
export class ContactPageComponent {
  /**
   * Reactive form builder.
   * Injected via `inject()` for tree-shakable DI in a standalone component.
   */
  private fb = inject(FormBuilder);

  /**
   * Transient UI state:
   * - `isSubmitting`: true while the (simulated) request is in-flight.
   * - `success`: success message to display after a successful submission.
   * - `error`: error message for validation or submission failures.
   */
  isSubmitting = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  /**
   * Contact form definition and validation rules.
   * Controls:
   * - `lastName` / `firstName`: required, max length 80.
   * - `email`: required, must match email format.
   * - `subject`: required, max length 120.
   * - `message`: required, length between 10 and 1500.
   * - `consent`: must be explicitly checked (requiredTrue).
   *
   * Usage in template:
   * - Bind inputs via `formControlName`.
   * - Use `hasError('controlName')` for displaying inline error states.
   */
  form = this.fb.group({
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.maxLength(120)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1500)]],
    consent: [false, Validators.requiredTrue]
  });

  /**
   * Handles form submission.
   * Behavior:
   * - If invalid: mark all controls as touched and set a generic error message.
   * - If valid: clear error, set `isSubmitting`, simulate async API, then:
   *   - clear `isSubmitting`
   *   - set a success message
   *   - reset the form (keeps `consent` unchecked).
   *
   * Integration guide:
   * - Replace the `setTimeout` block with a real HTTP call (e.g., HttpClient).
   * - On error, set `this.error.set('message')` and keep the form values.
   */
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Merci de compléter les champs requis.');
      return;
    }
    this.error.set(null);
    this.isSubmitting.set(true);

    // Hook your API call here (replace the simulated delay below).
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.success.set('Votre message a bien été envoyé. Nous vous répondrons rapidement.');
      this.form.reset({ consent: false });
    }, 700);
  }

  /**
   * Utility to check whether a control is both touched and invalid.
   * @param name Control name in the form group.
   * @returns true if the control exists, has been touched, and is invalid.
   */
  hasError(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.touched && c.invalid;
  }
}
