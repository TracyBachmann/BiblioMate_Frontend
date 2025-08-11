import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  address: string;
  phone: string;
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  // 3 étapes pour coller au DTO backend
  step = 1;

  registerForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isSubmitting = false;

  private readonly API_URL = 'https://localhost:7084/api/auths/register';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      // Étape 1
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],

      // Étape 2
      phone: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.maxLength(200)]],

      // Étape 3
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordsMatch });
  }

  // --- Validators
  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    if (!pass || !confirm) return null;
    return pass === confirm ? null : { passwordMismatch: true };
  }

  // --- Navigation d’étapes
  next(): void {
    if (this.canGoNext()) this.step++;
    else this.markCurrentStepTouched();
  }

  prev(): void {
    if (this.step > 1) this.step--;
  }

  canGoNext(): boolean {
    return this.currentStepGroup().valid;
  }

  private currentStepGroup(): FormGroup {
    // on regroupe à la volée les contrôles de l'étape courante
    const map: Record<number, string[]> = {
      1: ['name', 'email'],
      2: ['phone', 'address'],
      3: ['password', 'confirmPassword']
    };
    const controls = map[this.step];
    const g = this.fb.group({});
    controls.forEach(k => g.addControl(k, this.registerForm.get(k)!));
    return g;
  }

  private markCurrentStepTouched(): void {
    Object.values(this.currentStepGroup().controls).forEach(c => c.markAllAsTouched());
  }

  // --- Soumission
  submit(): void {
    if (!this.registerForm.valid) {
      this.step = [1, 2, 3].find(s => {
        const g = this.fb.group({});
        (s === 1 ? ['name', 'email']
            : s === 2 ? ['phone', 'address']
              : ['password', 'confirmPassword']
        ).forEach(k => g.addControl(k, this.registerForm.get(k)!));
        return g.invalid;
      }) ?? 1;
      this.markCurrentStepTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const { name, email, password, address, phone } = this.registerForm.value as RegisterPayload;

    this.http.post(this.API_URL, { name, email, password, address, phone }).subscribe({
      next: () => {
        // Backend : OK → email de confirmation envoyé
        this.successMessage = 'Inscription réussie ! Vérifiez votre e-mail pour confirmer votre compte.';
        this.isSubmitting = false;

        // Option : rediriger après 2s vers /connexion
        setTimeout(() => this.router.navigate(['/connexion']), 1800);
      },
      error: (err) => {
        // Le backend renvoie des messages explicites ; on les affiche tels quels
        this.errorMessage =
          err?.error?.error ||
          err?.error ||
          'Une erreur est survenue. Merci de réessayer.';
        this.isSubmitting = false;
      }
    });
  }

  // --- Helpers UI
  hasError(controlName: string): boolean {
    const c = this.registerForm.get(controlName);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  getErrorMessage(controlName: string): string {
    const c = this.registerForm.get(controlName);
    if (!c) return '';
    if (c.hasError('required')) return 'Ce champ est requis';
    if (c.hasError('email')) return 'Veuillez entrer une adresse email valide';
    if (c.hasError('minlength')) return 'Taille trop courte';
    if (c.hasError('maxlength')) return 'Taille trop longue';
    if (this.registerForm.hasError('passwordMismatch') && (controlName === 'password' || controlName === 'confirmPassword')) {
      return 'Les mots de passe ne correspondent pas';
    }
    return '';
  }
}
