import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgOptimizedImage],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  firstName = 'Jean';
  lastName = 'Dupont';
  avatarUrl: string | null = null;

  availableOptions = ['Option 1', 'Option 2', 'Option 3'];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      lastName: [this.lastName, [Validators.required]],
      firstName: [this.firstName, [Validators.required]],
      email: ['jean.dupont@example.com', [Validators.required, Validators.email]],
      phone: [''],
      dateOfBirth: [''],
      address1: [''],
      address2: [''],
      password: [''],
      options: [[]]
    });
  }

  submit(): void {
    if (this.profileForm.valid) {
      console.log('Profil sauvegardé :', this.profileForm.value);
      // TODO: appel API pour sauvegarder les infos
    } else {
      this.profileForm.markAllAsTouched();
    }
  }

  deactivate(): void {
    console.log('Profil désactivé');
    // TODO: implémenter l’appel API de désactivation
  }
}