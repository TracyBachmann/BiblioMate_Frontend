import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="container">
      <h1>Mot de passe oublié</h1>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <input type="email" formControlName="email" placeholder="Votre email" />
        <button type="submit" [disabled]="form.invalid || loading">Envoyer le lien</button>
      </form>

      <p *ngIf="done">Si l’email existe, un lien de réinitialisation a été envoyé.</p>
    </section>
  `
})
export default class ForgotPasswordComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  done = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.done = false;

    this.http.post('https://localhost:7084/api/auths/request-password-reset', this.form.value)
      .subscribe({
        next: () => { this.done = true; this.loading = false; },
        error: () => { this.done = true; this.loading = false; }
      });
  }
}
