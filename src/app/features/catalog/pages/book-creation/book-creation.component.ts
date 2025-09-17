import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';

import { BookService } from '../../../../core/services/book.service';

@Component({
  standalone: true,
  selector: 'app-book-creation',
  imports: [CommonModule, FormsModule, SectionTitleComponent],
  templateUrl: './book-creation.component.html',
  styleUrls: ['./book-creation.component.scss']
})
export class BookCreationComponent {
  model = {
    title: '',
    description: '',
    author: '',
    publisher: '',
    isbn: '',
    publicationDate: '',
    genres: [] as string[],
    tags: [] as string[],
    etage: '',
    allee: '',
    rayon: '',
    etagere: '',
    coverFile: null as File | null,
  };

  etages = ['Rez-de-chaussée', '1er étage', '2ème étage']; // TODO: charger dynamiquement


  tagsInput = '';
  coverPreview: string | null = null;

  availableGenres = ['Roman', 'Essai', 'BD', 'Poésie']; // TODO: charger depuis API
  allees = ['A', 'B', 'C']; // TODO: charger dynamiquement
  rayons: string[] = [];
  etageres: string[] = [];

  constructor(private booksApi: BookService, private router: Router) {}

  addTag() {
    if (this.tagsInput.trim()) {
      this.model.tags.push(this.tagsInput.trim());
      this.tagsInput = '';
    }
  }

  removeTag(tag: string) {
    this.model.tags = this.model.tags.filter(t => t !== tag);
  }

  updateRayons() {
    // TODO: charger dynamiquement selon allée
    this.rayons = ['Roman', 'Science', 'Art'];
    this.etageres = [];
  }

  updateEtageres() {
    // TODO: charger dynamiquement selon rayon
    this.etageres = ['Étagère 1', 'Étagère 2', 'Étagère 3'];
  }

  onCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.model.coverFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.coverPreview = reader.result as string;
      reader.readAsDataURL(this.model.coverFile);
    }
  }

  onSubmit() {
    console.log('Livre créé :', this.model);
    // TODO: appeler API -> this.booksApi.createBook(this.model)
    this.router.navigate(['/catalogue/management']);
  }
}
