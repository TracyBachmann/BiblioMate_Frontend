import { Component, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment';

@Component({
  standalone: true,
  selector: 'app-register-success',
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  template: `
    <div class="login-wrapper">
      <div class="login-page">
        <img ngSrc="assets/images/hero-background.png" width="1920" height="1080"
             alt="Bibliothèque de Montferrand" class="login-background" fetchpriority="high"/>

        <section class="login-form">
          <h1>Vérifiez votre e-mail ✉️</h1>
          <p class="login-subtext">
            Nous avons envoyé un lien de confirmation à <b>{{ email }}</b>.
          </p>

          <ul class="bullet">
            <li>Cliquez sur le lien pour confirmer votre adresse.</li>
            <li>Ensuite, un·e bibliothécaire devra <b>approuver</b> votre compte.</li>
          </ul>

          <div class="button-wrapper">
            <a routerLink="/connexion" class="styled-button">Aller à la connexion</a>
            <button class="styled-button secondary" (click)="resend()" [disabled]="resending">
              {{ resending ? 'Renvoi…' : 'Renvoyer l’e-mail' }}
            </button>
          </div>

          <p class="info" *ngIf="done && !error">E-mail renvoyé ✅</p>
          <p class="error-message" *ngIf="error">{{ error }}</p>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper{display:flex;flex-direction:column;height:100%}
    .login-page{position:relative;flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:1rem}
    .login-background{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1}
    .login-form{background:rgba(4,68,107,.85);color:#fff;padding:2rem;border-radius:1rem;max-width:90vw;display:flex;flex-direction:column;gap:1rem;font-family:'Inria Sans',sans-serif}
    .login-form h1{text-align:center;font-size:28px;font-weight:400;margin:0}
    .bullet{margin:0 0 .5rem 1.1rem}
    .bullet li{margin:.25rem 0}
    .button-wrapper{display:flex;gap:1rem;justify-content:center}
    .styled-button{flex:1;height:50px;border-radius:20px;border:2px solid #fbbc05;background:#fff;color:#000;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-decoration:none}
    .styled-button:hover{background:#fdf5dc}
    .styled-button.secondary{background:transparent;color:#fff;border-color:#fff}
    .styled-button.secondary:hover{background:rgba(255,255,255,.12)}
    .info{text-align:center}
    .error-message{color:#ffd5d5;text-align:center}
    @media (max-width:768px){.login-page{padding-top:100px;align-items:flex-start}.login-form{width:min(85vw,350px);padding:1.5rem}.button-wrapper{flex-direction:column}}
  `]
})
export default class RegisterSuccessComponent {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  // Email extracted from query params, used to display and resend
  email = this.route.snapshot.queryParamMap.get('email') ?? '';

  // Flags to manage UI state
  resending = false;   // true while request is being sent
  done = false;        // true if resend completed successfully
  error: string | null = null; // holds error message if resend fails

  /** Resend confirmation email to the provided address */
  resend() {
    if (!this.email) return;

    // Reset state before sending
    this.resending = true;
    this.done = false;
    this.error = null;

    // POST request to resend confirmation endpoint
    this.http.post(`${environment.apiBase}/api/auths/resend-confirmation`, { email: this.email })
      .subscribe({
        next: () => {
          // Success: show success message
          this.done = true;
          this.resending = false;
        },
        error: () => {
          // Failure: show error message
          this.error = 'Impossible de renvoyer le message pour le moment.';
          this.resending = false;
        }
      });
  }
}
