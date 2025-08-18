import { Component, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { environment } from '../../../environment';

@Component({
  standalone: true,
  selector: 'app-confirm-email',
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  template: `
    <div class="login-wrapper">
      <div class="login-page">
        <img ngSrc="assets/images/hero-background.png" width="1920" height="1080"
             alt="Bibliothèque de Montferrand" class="login-background" fetchpriority="high"/>

        <section class="login-form">
          <h1>Confirmation de l’email</h1>

          <p class="status loading" *ngIf="state==='loading'">Vérification en cours…</p>
          <p class="status ok" *ngIf="state==='ok'">Votre email a bien été confirmé ✅</p>
          <p class="status error" *ngIf="state==='error'">Lien invalide ou expiré ❌</p>

          <div class="button-wrapper single">
            <a routerLink="/connexion" class="styled-button">Aller à la connexion</a>
          </div>
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
    .status{text-align:center;margin:.25rem 0 .25rem}
    .status.ok{color:#c8f7c5}.status.error{color:#ffd5d5}
    .button-wrapper{display:flex;justify-content:center;gap:1rem}
    .button-wrapper.single .styled-button{width:80%}
    .styled-button{height:50px;border-radius:20px;border:2px solid #fbbc05;background:#fff;color:#000;font-size:18px;font-weight:400;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s}
    .styled-button:hover{background:#fdf5dc}
    @media (max-width:768px){.login-page{padding-top:100px;align-items:flex-start}.login-form{width:min(85vw,350px);padding:1.5rem;margin-top:1rem}}
  `]
})
export default class ConfirmEmailComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  state: 'loading' | 'ok' | 'error' = 'loading';

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.state = 'error'; return; }

    this.http.get(`${environment.apiBase}/api/auths/confirm-email`, { params: { token } })
      .subscribe({ next: () => this.state = 'ok', error: () => this.state = 'error' });
  }
}
