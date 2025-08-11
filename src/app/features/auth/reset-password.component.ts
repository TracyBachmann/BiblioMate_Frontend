import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <section class="container">
      <h1>Réinitialiser le mot de passe</h1>

      <ng-container [ngSwitch]="state">
        <p *ngSwitchCase="'error'">Lien invalide ou expiré ❌</p>

        <form *ngSwitchDefault [formGroup]="form" (ngSubmit)="submit()">
          <input type="password" placeholder="Nouveau mot de passe" formControlName="password" />
          <button type="submit" [disabled]="form.invalid || loading">Valider</button>
        </form>

        <p *ngIf="done">
          Mot de passe mis à jour ✅
          <a routerLink="/connexion">Se connecter</a>
        </p>
      </ng-container>
    </section>
  `
})
export default class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  token: string | null = null;
  state: 'form' | 'error' = 'form';
  form!: FormGroup;
  done = false;
  loading = false;

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.state = this.token ? 'form' : 'error';

    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit(): void {
    if (this.state === 'error' || this.form.invalid || !this.token) return;

    this.loading = true;

    this.http.post('https://localhost:7084/api/auths/reset-password', {
      token: this.token,
      newPassword: this.form.value.password
    }).subscribe({
      next: () => { this.done = true; this.loading = false; },
      error: () => { this.state = 'error'; this.loading = false; }
    });
  }
}
