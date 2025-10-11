import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { environment } from '../../../environment';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, NgOptimizedImage, RouterModule],
  template: `
    <div class="login-wrapper">
      <div class="login-page">
        <img loading="lazy" ngSrc="assets/images/hero-background-large.webp" ngSrcset="assets/images/hero-background-small.webp 400w, assets/images/hero-background-medium.webp 800w, assets/images/hero-background-large.webp 1200w" sizes="(max-width: 600px) 400px, (max-width: 1024px) 800px, 1200px" width="1200" height="991" alt="Biblioth�que" loading="lazy">

        <section class="login-form">
          <h1>Mot de passe oublié</h1>
          <p class="login-subtext">Saisissez votre adresse e-mail, nous vous enverrons un lien.</p>

          <!-- Reset password request form -->
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-vertical">
            <div class="form-field">
              <input type="email" placeholder="Votre email" formControlName="email"
                     [class.invalid]="emailCtrl?.touched && emailCtrl?.invalid"/>
              <div class="error-text" *ngIf="emailCtrl?.touched && emailCtrl?.invalid">
                Adresse e-mail invalide
              </div>
            </div>

            <div class="button-row">
              <button type="submit" class="styled-button" [disabled]="form.invalid || loading">
                {{ loading ? 'Envoi en cours…' : 'Envoyer le lien' }}
              </button>
              <a routerLink="/connexion" class="styled-button secondary">Retour à la connexion</a>
            </div>
          </form>

          <!-- Informational message shown after submission -->
          <p class="info" *ngIf="done">
            Si l’e-mail existe, un lien de réinitialisation a été envoyé.
          </p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper{display:flex;flex-direction:column;height:100%}
    .login-page{position:relative;flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:1rem}
    .login-background{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1}
    .login-form{background:rgba(4,68,107,.85);color:#fff;padding:2rem;border-radius:1rem;width:min(70vh,500px);max-width:90vw;display:flex;flex-direction:column;gap:1.25rem;font-family:'Inria Sans',sans-serif}
    .login-form h1{text-align:center;font-size:28px;font-weight:400;margin:0}
    .login-subtext{text-align:center;font-size:18px;opacity:.95;margin:0}
    .form-field{display:flex;flex-direction:column;gap:.25rem}
    input{padding:.75rem 1rem;height:50px;background:#fff;border:2px solid #fbbc05;border-radius:20px;outline:none;font-size:16px}
    .invalid{border-color:red!important}
    .error-text{color:#ffc107;font-size:.85rem}
    .button-row{display:flex;gap:1rem;justify-content:center;margin-top:2rem}
    .styled-button{flex:1;height:50px;border-radius:20px;border:2px solid #fbbc05;background:#fff;color:#000;font-size:18px;font-weight:400;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;text-decoration:none}
    .styled-button:hover{background:#fdf5dc}
    .styled-button.secondary{background:transparent;color:#fff;border-color:#fff}
    .styled-button.secondary:hover{background:rgba(255,255,255,.15)}
    .info{text-align:center;margin-top:.25rem}
    @media (max-width:768px){.login-page{padding-top:100px;align-items:flex-start}.login-form{width:min(85vw,350px);padding:1.5rem;margin-top:1rem}.button-row{flex-direction:column}}
  `]
})
export default class ForgotPasswordComponent implements OnInit {
  form!: FormGroup;
  loading = false; // true while the request is in progress
  done = false;    // true when request has completed (success or error)

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    // Initialize form with email control and validators
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  }

  /** Called when the user submits the form */
  submit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.done = false;

    // Send password reset request to the backend
    this.http.post(`${environment.apiBase}/Auths/request-password-reset`, this.form.value)
      .subscribe({
        next: () => {
          // Considered successful, show informational message
          this.done = true;
          this.loading = false;
        },
        error: () => {
          // Even in case of error, show "done" message (generic response)
          this.done = true;
          this.loading = false;
        }
      });
  }

  // Convenience getter for the email control
  get emailCtrl() { return this.form.get('email'); }
}
