import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors, FormControl
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../environment';

type Genre = { id: number; name: string };

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  address1: string;
  address2?: string | null;
  phone: string;
  dateOfBirth?: string | null;
  profileImage?: string | null;       // ← côté API: ProfileImage
  favoriteGenreIds?: number[];
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
  previewUrl: string | null = null;
  private selectedFile: File | null = null;

  private readonly API_REGISTER = `${environment.apiBase}/api/auths/register`;
  private readonly API_GENRES   = `${environment.apiBase}/api/genres`;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      lastName:  ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      email:     ['', [Validators.required, Validators.email]],
      phone:     ['', [Validators.required]],
      address1:  ['', [Validators.required, Validators.maxLength(200)]],
      address2:  [''],
      dateOfBirth:     [''],
      password:        ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
      confirmPassword: ['', [Validators.required]],
      profileImagePath: [''],                  // on garde ce champ local
      favoriteGenreIds: this.fb.nonNullable.control<number[]>([]),
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { validators: this.passwordsMatch });
  }

  ngOnInit(): void {
    this.http.get<any>(this.API_GENRES).subscribe({
      next: (data) => {
        const items: any[] = Array.isArray(data) ? data : (data?.items ?? []);
        this.genres = items
          .map(g => ({
            id: Number(g.id ?? g.Id ?? g.genreId ?? g.GenreId),
            name: g.name ?? g.Name
          }))
          .filter(g => Number.isFinite(g.id) && !!g.name);
      },
      error: () => { this.genres = []; } // silencieux si l’endpoint n’existe pas encore
    });
  }

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

  next(): void { if (this.currentStepValid()) this.step++; else this.markCurrentStepTouched(); }
  prev(): void { if (this.step > 1) this.step--; }

  private currentStepValid(): boolean {
    return this.controlsForStep(this.step).every(k => this.registerForm.get(k)?.valid);
  }

  private markCurrentStepTouched(): void {
    this.controlsForStep(this.step).forEach(k => this.registerForm.get(k)?.markAllAsTouched());
  }

  private controlsForStep(step: number): string[] {
    switch (step) {
      case 1: return ['lastName', 'firstName', 'email'];
      case 2: return ['phone', 'address1', 'address2'];
      case 3: return ['dateOfBirth', 'password', 'confirmPassword'];
      case 4: return ['profileImagePath'];
      case 5: return ['favoriteGenreIds', 'acceptTerms'];
      default: return [];
    }
  }

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

  submit(): void {
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
      profileImage: null,
      favoriteGenreIds: this.favoriteGenreIds.value?.length ? this.favoriteGenreIds.value : undefined
    };

    this.http.post(this.API_REGISTER, payload).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/inscription/verification'], {
          queryParams: { email: v.email }
        });
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || err?.error || 'Une erreur est survenue. Merci de réessayer.';
        this.isSubmitting = false;
      }
    });
  }

  toggleGenre(id: number): void {
    const set = new Set(this.favoriteGenreIds.value ?? []);
    if (set.has(id)) set.delete(id); else set.add(id);
    this.favoriteGenreIds.setValue([...set]);
  }
}
