import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { UserService, UserProfile } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

/** ✅ Custom validator: date must not be in the future */
const notFutureDate: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (!value) {return null;}
  const today = new Date();
  const dob = new Date(value);
  return dob > today ? { futureDate: true } : null;
};

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  /** Reactive form for profile data */
  profileForm!: FormGroup;

  /** Current avatar URL (or null if not set) */
  avatarUrl: string | null = null;

  /** Feedback messages displayed in template */
  successMessage: string | null = null;
  errorMessage: string | null = null;

  /** Injected services */
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

  /** Signals for firstName and lastName (from AuthService observables) */
  private firstNameSig = toSignal(this.auth.firstName$, { initialValue: null });
  private lastNameSig = toSignal(this.auth.lastName$, { initialValue: null });

  /** Computed full name for display in greeting */
  readonly displayName = computed(() =>
    `${this.firstNameSig() ?? ''} ${this.lastNameSig() ?? ''}`.trim()
  );

  /** Example options (could be genres, tags, etc.) */
  availableOptions = ['Option 1', 'Option 2', 'Option 3'];

  /** Initialize form and load profile data */
  ngOnInit(): void {
    this.profileForm = this.fb.group({
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      phone: ['', [Validators.pattern(/^[0-9]{10}$/)]], // French phone format: 10 digits
      dateOfBirth: ['', [notFutureDate]],
      address1: ['', [Validators.maxLength(100)]],
      address2: ['', [Validators.maxLength(100)]],
      password: [
        '',
        [
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/) // at least 1 uppercase, 1 lowercase, 1 digit
        ]
      ],
      options: [[]]
    });

    this.loadUserProfile();
  }

  /** Load user profile from backend and populate form */
  loadUserProfile(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user: UserProfile) => {
        this.profileForm.patchValue({
          lastName: user.lastName,
          firstName: user.firstName,
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth ? user.dateOfBirth.substring(0, 10) : '',
          address1: user.address1,
          address2: user.address2
        });
        this.avatarUrl = user.profileImagePath ?? null;
      },
      error: (err: unknown) => {
        console.error('Erreur lors du chargement du profil', err);
        this.errorMessage = '❌ Impossible de charger votre profil.';
      }
    });
  }

  /** Submit form: update user profile */
  submit(): void {
    if (this.profileForm.valid) {
      this.userService.updateCurrentUser(this.profileForm.value).subscribe({
        next: () => {
          this.successMessage = '✅ Profil mis à jour avec succès !';
          this.errorMessage = null;
          setTimeout(() => (this.successMessage = null), 3000);
        },
        error: (err: unknown) => {
          console.error(err);
          this.errorMessage = '❌ Erreur lors de la mise à jour du profil.';
          this.successMessage = null;
        }
      });
    } else {
      this.profileForm.markAllAsTouched();
      this.errorMessage = '⚠️ Merci de corriger les erreurs dans le formulaire.';
    }
  }

  /** Delete user profile (deactivate account) */
  deactivate(): void {
    if (confirm('Voulez-vous vraiment désactiver votre profil ?')) {
      this.userService.deleteCurrentUser().subscribe({
        next: () => {
          this.successMessage = '✅ Votre profil a été désactivé.';
          this.errorMessage = null;
          // TODO: redirect to /connexion if required
        },
        error: (err: unknown) => {
          console.error(err);
          this.errorMessage = '❌ Erreur lors de la désactivation du profil.';
          this.successMessage = null;
        }
      });
    }
  }
}
