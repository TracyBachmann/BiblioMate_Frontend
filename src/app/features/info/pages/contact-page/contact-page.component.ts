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
  private fb = inject(FormBuilder);

  isSubmitting = signal(false);
  success = signal<string | null>(null);
  error = signal<string | null>(null);

  form = this.fb.group({
    lastName: ['', [Validators.required, Validators.maxLength(80)]],
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', [Validators.required, Validators.maxLength(120)]],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1500)]],
    consent: [false, Validators.requiredTrue]
  });

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Merci de compléter les champs requis.');
      return;
    }
    this.error.set(null);
    this.isSubmitting.set(true);

    // 👉 Ici, tu brancheras ton appel API
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.success.set('Votre message a bien été envoyé. Nous vous répondrons rapidement.');
      this.form.reset({ consent: false });
    }, 700);
  }

  hasError(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.touched && c.invalid;
  }
}

