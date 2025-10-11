import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environment';

interface LoginResponse { token: string }

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  // Reactive form instance for login
  loginForm: FormGroup;

  // Stores error message for display in the template
  errorMessage: string | null = null;

  // Indicates if a login request is in progress
  isSubmitting = false;

  // Endpoint for authentication
  private readonly API_URL = `${environment.apiBase}/api/auths/login`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private auth: AuthService,
    private route: ActivatedRoute
  ) {
    // Define form structure and validation rules
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      remember: [false]
    });
  }

  ngOnInit(): void {
    // If user is already authenticated, redirect to personal space
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl('/espace', { replaceUrl: true });
      return;
    }

    // Handle query params for post-registration message
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('registered') === '1') {
      const email = qp.get('email') || 'votre adresse e-mail';
      this.errorMessage = `Compte créé ✅ Un e-mail de confirmation a été envoyé à ${email}. Ouvrez-le pour activer votre compte.`;
    }
  }

  /** Triggered when the form is submitted */
  submit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    // Extract values from the form
    const { email, password, remember } = this.loginForm.value as {
      email: string; password: string; remember: boolean;
    };

    // Send login request to the API
    this.http.post<LoginResponse>(this.API_URL, { email, password }).subscribe({
      next: (res) => {
        // Validate response
        if (!res?.token) {
          this.errorMessage = 'Réponse invalide du serveur.';
          this.isSubmitting = false;
          return;
        }

        // Save token in AuthService
        this.auth.login(res.token, !!remember);

        // Redirect to returnUrl or default to /espace
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/espace';
        this.router.navigateByUrl(returnUrl, { replaceUrl: true });
      },
      error: (err) => {
        // Map API error messages to user-friendly text
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

  /** Utility: check if a control is invalid and touched/dirty */
  hasError(name: string): boolean {
    const c = this.loginForm.get(name);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  /** Utility: return a proper error message for a control */
  getErrorMessage(name: string): string {
    const c = this.loginForm.get(name);
    if (c?.hasError('required')) {return 'Ce champ est requis';}
    if (c?.hasError('email')) {return 'Veuillez entrer une adresse email valide';}
    return '';
  }
}
