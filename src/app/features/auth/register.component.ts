import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors, FormControl
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';

type Genre = { id: number; name: string };

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address1: string;
  address2?: string | null;
  phone: string;
  dateOfBirth?: string | null;      // ISO yyyy-MM-dd
  profileImagePath?: string | null; // pour l’instant: null
  favoriteGenreIds?: number[];      // facultatif
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  step = 1;
  registerForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  genres: Genre[] = [];
  previewUrl: string | null = null;       // aperçu local de l’image
  private selectedFile: File | null = null;

  private readonly API_REGISTER = 'https://localhost:7084/api/auths/register';
  private readonly API_GENRES   = 'https://localhost:7084/api/genres'; // suppose un GET disponible

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      // Étape 1
      lastName:  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      email:     ['', [Validators.required, Validators.email]],

      // Étape 2
      phone:    ['', [Validators.required]],
      address1: ['', [Validators.required, Validators.maxLength(200)]],
      address2: [''],

      // Étape 3
      dateOfBirth:     [''],
      password:        ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]],

      // Étape 4
      profileImagePath: [''],

      // Étape 5
      favoriteGenreIds: new FormControl<number[]>([]),
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordsMatch });
  }

  ngOnInit(): void {
    // Charger la liste des genres (si l’endpoint existe)
    this.http.get<Genre[]>(this.API_GENRES).subscribe({
      next: (data) => this.genres = data ?? [],
      error: () => { /* silencieux si indispo */ }
    });
  }

  // ====== helpers formulaire ======

  get favoriteGenreIds(): FormControl<number[]> {
    return this.registerForm.get('favoriteGenreIds') as FormControl<number[]>;
  }

  private passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const p  = group.get('password')?.value;
    const cp = group.get('confirmPassword')?.value;
    if (!p || !cp) return null;
    return p === cp ? null : { passwordMismatch: true };
  }

  hasError(name: string): boolean {
    const c = this.registerForm.get(name);
    return !!(c && c.invalid && (c.touched || c.dirty));
  }

  getErrorMessage(name: string): string {
    const c = this.registerForm.get(name);
    if (!c) return '';
    if (c.hasError('required')) return 'Ce champ est requis';
    if (c.hasError('requiredTrue')) return 'Veuillez accepter les conditions';
    if (c.hasError('email')) return 'Veuillez entrer une adresse email valide';
    if (c.hasError('minlength')) return 'Taille trop courte';
    if (c.hasError('maxlength')) return 'Taille trop longue';
    if (this.registerForm.hasError('passwordMismatch') && (name === 'password' || name === 'confirmPassword')) {
      return 'Les mots de passe ne correspondent pas';
    }
    return '';
  }

  // ====== navigation ======

  next(): void {
    if (this.currentStepValid()) this.step++;
    else this.markCurrentStepTouched();
  }

  prev(): void {
    if (this.step > 1) this.step--;
  }

  private currentStepValid(): boolean {
    const controls = this.controlsForStep(this.step);
    const tmp = this.fb.group({});
    controls.forEach(k => tmp.addControl(k, this.registerForm.get(k)!));
    return tmp.valid;
  }

  private markCurrentStepTouched(): void {
    this.controlsForStep(this.step).forEach(k => this.registerForm.get(k)?.markAllAsTouched());
  }

  private controlsForStep(step: number): string[] {
    switch (step) {
      case 1: return ['lastName', 'firstName', 'email'];
      case 2: return ['phone', 'address1', 'address2'];
      case 3: return ['dateOfBirth', 'password', 'confirmPassword'];
      case 4: return ['profileImagePath'];          // facultatif, donc toujours “valide”
      case 5: return ['favoriteGenreIds', 'acceptTerms'];
      default: return [];
    }
  }

  // ====== image (facultatif / pas d’upload côté API pour l’instant) ======

  onFileSelected(evt: Event): void {
    const file = (evt.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result as string;
    reader.readAsDataURL(file);
  }

  clearImage(e: MouseEvent): void {
    e.stopPropagation();
    this.selectedFile = null;
    this.previewUrl = null;
    this.registerForm.patchValue({ profileImagePath: '' });
  }

  // ====== soumission ======

  submit(): void {
    // trouve la première étape invalide et y revient
    if (!this.registerForm.valid) {
      for (let s = 1; s <= 5; s++) {
        const tmp = this.fb.group({});
        this.controlsForStep(s).forEach(k => tmp.addControl(k, this.registerForm.get(k)!));
        if (tmp.invalid) { this.step = s; break; }
      }
      this.markCurrentStepTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const v = this.registerForm.value;
    const payload: RegisterPayload = {
      firstName: v.firstName,
      lastName:  v.lastName,
      email:     v.email,
      password:  v.password,
      address1:  v.address1,
      address2:  v.address2 || null,
      phone:     v.phone,
      dateOfBirth: v.dateOfBirth || null,
      profileImagePath: null,              // pas d’upload pour l’instant
      favoriteGenreIds: this.favoriteGenreIds.value?.length ? this.favoriteGenreIds.value : undefined
    };

    this.http.post(this.API_REGISTER, payload).subscribe({
      next: () => {
        this.successMessage = 'Inscription réussie ! Vérifiez votre e-mail pour confirmer votre compte.';
        this.isSubmitting = false;
        setTimeout(() => this.router.navigate(['/connexion']), 1500);
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.error ||
          err?.error ||
          'Une erreur est survenue. Merci de réessayer.';
        this.isSubmitting = false;
      }
    });
  }

  // sélection/désélection de genre (chips)
  toggleGenre(id: number): void {
    const arr = new Set(this.favoriteGenreIds.value ?? []);
    if (arr.has(id)) arr.delete(id); else arr.add(id);
    this.favoriteGenreIds.setValue([...arr]);
  }
}
