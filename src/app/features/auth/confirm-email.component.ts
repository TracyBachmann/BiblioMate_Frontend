import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-confirm-email',
  imports: [CommonModule, RouterModule],
  template: `
    <section class="container">
      <h1>Confirmation de l’email</h1>
      <p *ngIf="state==='loading'">Vérification en cours...</p>
      <p *ngIf="state==='ok'">Votre email a bien été confirmé ✅</p>
      <p *ngIf="state==='error'">Lien invalide ou expiré ❌</p>

      <a routerLink="/connexion" class="btn">Aller à la connexion</a>
    </section>
  `
})
export default class ConfirmEmailComponent {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  state: 'loading' | 'ok' | 'error' = 'loading';

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) { this.state = 'error'; return; }

    this.http.get('https://localhost:7084/api/auths/confirm-email', { params: { token } })
      .subscribe({
        next: () => this.state = 'ok',
        error: () => this.state = 'error'
      });
  }
}
