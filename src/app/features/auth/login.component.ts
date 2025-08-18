import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environment';

type LoginResponse = { token: string };

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = false;

  private readonly API_URL = `${environment.apiBase}/api/auths/login`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],   // <- removed stray parenthesis
      remember: [false]
    });
  }

  submit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const { email, password, remember } = this.loginForm.value as {
      email: string; password: string; remember: boolean;
    };

    this.http.post<LoginResponse>(this.API_URL, { email, password }).subscribe({
      next: (res) => {
        if (!res?.token) {
          this.errorMessage = 'Réponse invalide du serveur.';
          this.isSubmitting = false;
          return;
        }
        this.auth.login(res.token, !!remember);
        const returnUrl = new URLSearchParams(location.search).get('returnUrl') ?? '/';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        const apiMsg = err?.error?.error || err?.error;
        if (apiMsg === 'Account awaiting admin approval.') {
          this.errorMessage = 'Votre compte a bien été créé, mais il doit être approuvé par un·e bibliothécaire.';
        } else if (apiMsg === 'Email not confirmed.') {
          this.errorMessage = 'Veuillez confirmer votre adresse e-mail avant de vous connecter.';
        } else {
          this.errorMessage = (err?.status === 0)
            ? 'Impossible de joindre le serveur.'
            : 'Identifiants invalides.';
        }
        this.isSubmitting = false;
      }
    });
  }

  hasError(name: string): boolean {
    const c = this.loginForm.get(name);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  getErrorMessage(name: string): string {
    const c = this.loginForm.get(name);
    if (c?.hasError('required')) return 'Ce champ est requis';
    if (c?.hasError('email')) return 'Veuillez entrer une adresse email valide';
    return '';
  }
}
