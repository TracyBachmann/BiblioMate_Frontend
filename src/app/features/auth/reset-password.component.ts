import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
  template: `
    <div class="login-wrapper">
      <div class="login-page">
        <img ngSrc="assets/images/hero-background.png" width="1920" height="1080"
             alt="Bibliothèque de Montferrand" class="login-background" fetchpriority="high"/>

        <section class="login-form">
          <h1>Réinitialiser le mot de passe</h1>

          <ng-container [ngSwitch]="state">
            <!-- Error state: invalid or expired link -->
            <p class="status error" *ngSwitchCase="'error'">Lien invalide ou expiré ❌</p>

            <!-- Default state: show reset password form -->
            <form *ngSwitchDefault [formGroup]="form" (ngSubmit)="submit()">
              <div class="form-field">
                <input type="password" placeholder="Nouveau mot de passe" formControlName="password"
                       [class.invalid]="passwordCtrl?.touched && passwordCtrl?.invalid"/>
                <div class="error-text" *ngIf="passwordCtrl?.touched && passwordCtrl?.invalid">
                  6 caractères minimum
                </div>
              </div>

              <div class="button-row">
                <button type="submit" class="styled-button" [disabled]="form.invalid || loading">
                  {{ loading ? 'Validation…' : 'Valider' }}
                </button>
                <a routerLink="/connexion" class="styled-button secondary">Se connecter</a>
              </div>
            </form>

            <!-- Success state: password successfully reset -->
            <p class="status ok" *ngIf="done">Mot de passe mis à jour ✅</p>
          </ng-container>
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
    .form-field{display:flex;flex-direction:column;gap:.25rem}
    input{padding:.75rem 1rem;height:50px;background:#fff;border:2px solid #fbbc05;border-radius:20px;outline:none;font-size:16px}
    .invalid{border-color:red!important}
    .error-text{color:#ffc107;font-size:.85rem}
    .button-row{display:flex;gap:1rem;justify-content:center;margin-top:.25rem}
    .styled-button{flex:1;height:50px;border-radius:20px;border:2px solid #fbbc05;background:#fff;color:#000;font-size:18px;font-weight:400;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
    .styled-button:hover{background:#fdf5dc}
    .styled-button.secondary{background:transparent;color:#fff;border-color:#fff}
    .styled-button.secondary:hover{background:rgba(255,255,255,.15)}
    .status{text-align:center;margin:.25rem 0}
    .status.ok{color:#c8f7c5}.status.error{color:#ffd5d5}
    @media (max-width:768px){.login-page{padding-top:100px;align-items:flex-start}.login-form{width:min(85vw,350px);padding:1.5rem;margin-top:1rem}.button-row{flex-direction:column}}
  `]
})
export default class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);  // Access to query params (token)
  private http  = inject(HttpClient);      // HTTP client for API calls
  private fb    = inject(FormBuilder);     // Reactive forms builder

  token: string | null = null;             // Token from the reset link
  state: 'form' | 'error' = 'form';        // Component state: show form or error
  form!: FormGroup;                        // Form with password field
  done = false;                            // Flag for success message
  loading = false;                         // Flag for button loading state

  ngOnInit(): void {
    // Extract token from query params
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.state = this.token ? 'form' : 'error';

    // Initialize the form with password field
    this.form = this.fb.group({ password: ['', [Validators.required, Validators.minLength(6)]] });
  }

  /** Submit the form and call the API to reset the password */
  submit(): void {
    if (this.state === 'error' || this.form.invalid || !this.token) return;
    this.loading = true;

    this.http.post(`${environment.apiBase}/Auths/reset-password`, {
      token: this.token,
      newPassword: this.form.value.password
    }).subscribe({
      next: () => { this.done = true; this.loading = false; },
      error: () => { this.state = 'error'; this.loading = false; }
    });
  }

  /** Getter for easier access to the password control */
  get passwordCtrl() { return this.form.get('password'); }
}

