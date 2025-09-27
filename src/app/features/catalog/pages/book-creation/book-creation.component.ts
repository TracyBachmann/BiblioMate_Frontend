import { Component, OnInit, HostListener, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { BookService, Book } from '../../../../core/services/book.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

type Mode = 'new' | 'edit';

@Component({
  standalone: true,
  selector: 'app-book-creation',
  imports: [CommonModule, FormsModule, SectionTitleComponent],
  templateUrl: './book-creation.component.html',
  styleUrls: ['./book-creation.component.scss']
})
export class BookCreationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private booksApi = inject(BookService);

  mode: Mode = 'new';
  editId: string | null = null;

  pageTitle = 'Ajout d’un livre au catalogue';
  submitLabel = 'Ajouter le livre';

  model = {
    title: '',
    description: '',
    author: '',
    publisher: '',
    isbn: '',
    publicationDate: '',
    genres: [] as string[],
    tags: [] as string[],

    // Localisation + Stock
    floor: null as number | null,
    aisle: '',
    rayon: '',
    etagere: 1,
    stockQuantity: 0,

    coverFile: null as File | null,
  };

  // Suggestions cascade simples
  floors: number[] = [];
  aisles: string[] = [];
  rayons: string[] = [];
  levels: number[] = [];

  // Genres
  availableGenres: string[] = [];
  filteredGenres: string[] = [];
  genreQuery = '';
  genresLoading = false;
  openGenres = false;
  activeGenreIndex = 0;
  @ViewChild('genreInputRef') genreInputRef!: ElementRef<HTMLInputElement>;

  // Tags
  availableTags: string[] = [];
  filteredTags: string[] = [];
  tagQuery = '';
  tagsLoading = false;
  openTags = false;
  activeTagIndex = 0;
  @ViewChild('tagInputRef') tagInputRef!: ElementRef<HTMLInputElement>;

  // Localisation dropdowns
  availableFloors: string[] = [];
  filteredFloors: string[] = [];
  floorQuery = '';
  openFloors = false;
  activeFloorIndex = 0;

  availableAisles: string[] = [];
  filteredAisles: string[] = [];
  aisleQuery = '';
  openAisles = false;
  activeAisleIndex = 0;

  availableRayons: string[] = [];
  filteredRayons: string[] = [];
  rayonQuery = '';
  openRayons = false;
  activeRayonIndex = 0;

  availableLevels: string[] = [];
  filteredLevels: string[] = [];
  levelQuery = '';
  openLevels = false;
  activeLevelIndex = 0;

  // Autocomplete auteur/éditeur
  authorSuggestions: string[] = [];
  openAuthor = false;
  activeAuthorIndex = 0;
  private authorDebounce: any;

  publisherSuggestions: string[] = [];
  openPublisher = false;
  activePublisherIndex = 0;
  private publisherDebounce: any;

  tagsInput = '';
  coverPreview: string | null = null;

  ngOnInit(): void {
    (window as any).bookCreationComp = this;
    // Genres
    this.genresLoading = true;
    this.booksApi.getGenres().subscribe({
      next: (list) => {
        this.availableGenres = Array.isArray(list) ? list : [];
        this.filteredGenres = [...this.availableGenres];
        this.genresLoading = false;
      },
      error: () => { this.availableGenres = []; this.filteredGenres = []; this.genresLoading = false; }
    });

    // Tags
    this.tagsLoading = true;
    this.booksApi.getTags().subscribe({
      next: (list) => {
        this.availableTags = Array.isArray(list) ? list : [];
        this.filteredTags = [...this.availableTags];
        this.tagsLoading = false;
      },
      error: () => { this.availableTags = []; this.filteredTags = []; this.tagsLoading = false; }
    });

    // Floors + préchargement cascade
    this.booksApi.getFloors().subscribe({
      next: rows => {
        this.availableFloors = rows;
        this.filteredFloors = [...rows];

        // Si on a au moins un étage, précharger les allées correspondantes
        if (this.availableFloors.length) {
          const firstFloor = Number(this.availableFloors[0]);
          this.booksApi.getAisles(firstFloor).subscribe({
            next: aisles => {
              this.availableAisles = aisles;
              this.filteredAisles = [...aisles];
            },
            error: () => { this.availableAisles = []; this.filteredAisles = []; }
          });
        }
      },
      error: () => { this.availableFloors = []; this.filteredFloors = []; }
    });

    // Mode (new / edit)
    this.route.queryParamMap.subscribe(pm => {
      const m = (pm.get('mode') as Mode) || 'new';
      const id = pm.get('id');
      this.mode = m;
      this.editId = m === 'edit' && id ? id : null;

      if (this.mode === 'edit' && this.editId) {
        this.pageTitle = 'Modification du livre';
        this.submitLabel = 'Enregistrer les modifications';
        this.loadForEdit(this.editId);
      } else {
        this.pageTitle = 'Ajout d’un livre au catalogue';
        this.submitLabel = 'Ajouter le livre';
      }
    });
  }

  private norm = (s: string) => (s || '').trim().toLowerCase();

  // ===== Genres =====
  toggleGenres(open: boolean) {
    this.openGenres = open;
    if (open) {
      setTimeout(() => this.genreInputRef?.nativeElement.focus(), 0);
      this.filterGenres();
    }
  }
  filterGenres(): void {
    const q = this.genreQuery.trim().toLowerCase();
    this.filteredGenres = q ? this.availableGenres.filter(g => g.toLowerCase().includes(q)) : [...this.availableGenres];
    this.activeGenreIndex = 0;
  }
  isGenreSelected(g: string): boolean { return this.model.genres.includes(g); }
  toggleGenreToken(g: string): void {
    if (this.isGenreSelected(g)) this.model.genres = this.model.genres.filter(x => x !== g);
    else this.model.genres.push(g);
    this.genreQuery = '';
    this.filterGenres();
    this.toggleGenres(true);
  }
  removeGenre(g: string) { this.model.genres = this.model.genres.filter(x => x !== g); }
  canCreateGenre(): boolean {
    const q = this.genreQuery.trim();
    if (!q) return false;
    return !this.availableGenres.some(g => this.norm(g) === this.norm(q));
  }
  createGenreFromQuery(): void {
    const name = this.genreQuery.trim();
    if (!name) return;
    this.genresLoading = true;
    this.booksApi.ensureGenre(name).subscribe({
      next: (dto: any) => {
        const label = dto?.name?.trim() || name;
        if (!this.availableGenres.some(g => this.norm(g) === this.norm(label))) {
          this.availableGenres = [label, ...this.availableGenres].sort((a, b) => a.localeCompare(b));
        }
        if (!this.model.genres.some(g => this.norm(g) === this.norm(label))) {
          this.model.genres = [...this.model.genres, label];
        }
        this.genreQuery = '';
        this.filterGenres();
        this.openGenres = true;
        this.genresLoading = false;
      },
      error: () => {
        if (!this.availableGenres.some(g => this.norm(g) === this.norm(name))) {
          this.availableGenres = [name, ...this.availableGenres];
        }
        if (!this.model.genres.some(g => this.norm(g) === this.norm(name))) {
          this.model.genres = [...this.model.genres, name];
        }
        this.genreQuery = '';
        this.filterGenres();
        this.openGenres = true;
        this.genresLoading = false;
      }
    });
  }
  onGenreInputKey(e: KeyboardEvent) {
    const max = this.filteredGenres.length - 1;
    if (e.key === 'ArrowDown') { this.activeGenreIndex = Math.min(max, this.activeGenreIndex + 1); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { this.activeGenreIndex = Math.max(0, this.activeGenreIndex - 1); e.preventDefault(); }
    else if (e.key === 'Enter') { const pick = this.filteredGenres[this.activeGenreIndex]; if (pick) this.toggleGenreToken(pick); else if (this.canCreateGenre()) this.createGenreFromQuery(); e.preventDefault(); }
    else if (e.key === 'Escape') { this.openGenres = false; e.preventDefault(); }
    else if (e.key === 'Backspace' && !this.genreQuery && this.model.genres.length) { this.model.genres = this.model.genres.slice(0, -1); }
  }

  // ===== Tags =====
  toggleTags(open: boolean) {
    this.openTags = open;
    if (open) {
      setTimeout(() => this.tagInputRef?.nativeElement.focus(), 0);
      this.filterTags();
    }
  }
  filterTags(): void {
    const q = this.tagQuery.trim().toLowerCase();
    this.filteredTags = q ? this.availableTags.filter(t => t.toLowerCase().includes(q)) : [...this.availableTags];
    this.activeTagIndex = 0;
  }
  isTagSelected(t: string): boolean { return this.model.tags.includes(t); }
  toggleTagToken(t: string): void {
    if (this.isTagSelected(t)) this.model.tags = this.model.tags.filter(x => x !== t);
    else this.model.tags.push(t);
    this.tagQuery = '';
    this.filterTags();
    this.toggleTags(true);
  }
  removeTag(t: string) { this.model.tags = this.model.tags.filter(x => x !== t); }
  canCreateTag(): boolean {
    const q = this.tagQuery.trim();
    if (!q) return false;
    return !this.availableTags.some(t => this.norm(t) === this.norm(q));
  }
  createTagFromQuery(): void {
    const name = this.tagQuery.trim();
    if (!name) return;
    this.tagsLoading = true;
    this.booksApi.ensureTag(name).subscribe({
      next: (dto: any) => {
        const label = dto?.name?.trim() || name;
        if (!this.availableTags.some(t => this.norm(t) === this.norm(label))) {
          this.availableTags = [label, ...this.availableTags].sort((a, b) => a.localeCompare(b));
        }
        if (!this.model.tags.some(t => this.norm(t) === this.norm(label))) {
          this.model.tags = [...this.model.tags, label];
        }
        this.tagQuery = '';
        this.filterTags();
        this.openTags = true;
        this.tagsLoading = false;
      },
      error: () => {
        if (!this.availableTags.some(t => this.norm(t) === this.norm(name))) {
          this.availableTags = [name, ...this.availableTags];
        }
        if (!this.model.tags.some(t => this.norm(t) === this.norm(name))) {
          this.model.tags = [...this.model.tags, name];
        }
        this.tagQuery = '';
        this.filterTags();
        this.openTags = true;
        this.tagsLoading = false;
      }
    });
  }
  onTagInputKey(e: KeyboardEvent) {
    const max = this.filteredTags.length - 1;
    if (e.key === 'ArrowDown') { this.activeTagIndex = Math.min(max, this.activeTagIndex + 1); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { this.activeTagIndex = Math.max(0, this.activeTagIndex - 1); e.preventDefault(); }
    else if (e.key === 'Enter') { const pick = this.filteredTags[this.activeTagIndex]; if (pick) this.toggleTagToken(pick); else if (this.canCreateTag()) this.createTagFromQuery(); e.preventDefault(); }
    else if (e.key === 'Escape') { this.openTags = false; e.preventDefault(); }
    else if (e.key === 'Backspace' && !this.tagQuery && this.model.tags.length) { this.model.tags = this.model.tags.slice(0, -1); }
  }

  // ===== Localisation: FLOORS =====
  toggleFloors(open: boolean) {
    this.openFloors = open;
    if (open) {
      if (!this.availableFloors.length) {
        this.booksApi.getFloors().subscribe({
          next: rows => {
            this.availableFloors = rows;
            this.filteredFloors = [...rows];
          },
          error: () => { this.availableFloors = []; this.filteredFloors = []; }
        });
      } else {
        this.filterFloors();
      }
    }
  }
  filterFloors() {
    const q = this.floorQuery.trim().toLowerCase();
    this.filteredFloors = q ? this.availableFloors.filter(f => f.toLowerCase().includes(q)) : [...this.availableFloors];
    this.activeFloorIndex = 0;
  }
  applyFloor(f: string) {
    this.floorQuery = f;
    this.model.floor = Number(f);
    this.openFloors = false;
    this.onFloorChanged();
  }

  // ===== Localisation: AISLES =====
  toggleAisles(open: boolean) {
    this.openAisles = open;
    if (open) {
      if (!this.availableAisles.length && this.model.floor) {
        this.booksApi.getAisles(Number(this.model.floor)).subscribe({
          next: rows => {
            this.availableAisles = rows;
            this.filteredAisles = [...rows];
          },
          error: () => { this.availableAisles = []; this.filteredAisles = []; }
        });
      } else {
        this.filterAisles();
      }
    }
  }
  filterAisles() {
    const q = this.aisleQuery.trim().toLowerCase();
    this.filteredAisles = q ? this.availableAisles.filter(a => a.toLowerCase().includes(q)) : [...this.availableAisles];
    this.activeAisleIndex = 0;
  }
  applyAisle(a: string) {
    this.aisleQuery = a;
    this.model.aisle = a;
    this.openAisles = false;
    this.onAisleChanged();
  }

  // ===== Localisation: RAYONS =====
  toggleRayons(open: boolean) {
    this.openRayons = open;
    if (open) {
      if (!this.availableRayons.length && this.model.floor && this.model.aisle) {
        this.booksApi.getShelves(Number(this.model.floor), this.model.aisle).subscribe({
          next: rows => {
            this.availableRayons = rows.map(r => r.name);
            this.filteredRayons = [...this.availableRayons];
          },
          error: () => { this.availableRayons = []; this.filteredRayons = []; }
        });
      } else {
        this.filterRayons();
      }
    }
  }
  filterRayons() {
    const q = this.rayonQuery.trim().toLowerCase();
    this.filteredRayons = q ? this.availableRayons.filter(r => r.toLowerCase().includes(q)) : [...this.availableRayons];
    this.activeRayonIndex = 0;
  }
  applyRayon(r: string) {
    this.rayonQuery = r;
    this.model.rayon = r;
    this.openRayons = false;
    this.onRayonChanged();
  }

  // ===== Localisation: LEVELS =====
  toggleLevels(open: boolean) {
    this.openLevels = open;
    if (open) {
      if (!this.availableLevels.length && this.model.floor && this.model.aisle && this.model.rayon) {
        this.booksApi.getShelves(Number(this.model.floor), this.model.aisle).subscribe({
          next: rows => {
            const found = rows.find(x => x.name.toLowerCase() === this.model.rayon.toLowerCase());
            if (!found) return;
            this.booksApi.getLevels(found.shelfId).subscribe({
              next: lvls => {
                this.availableLevels = lvls.map(String);
                this.filteredLevels = [...this.availableLevels];
              },
              error: () => { this.availableLevels = []; this.filteredLevels = []; }
            });
          },
          error: () => { this.availableLevels = []; this.filteredLevels = []; }
        });
      } else {
        this.filterLevels();
      }
    }
  }
  filterLevels() {
    const q = this.levelQuery.trim().toLowerCase();
    this.filteredLevels = q ? this.availableLevels.filter(l => l.toLowerCase().includes(q)) : [...this.availableLevels];
    this.activeLevelIndex = 0;
  }
  applyLevel(l: string) {
    this.levelQuery = l;
    this.model.etagere = Number(l);
    this.openLevels = false;
  }

  // ===== Autocomplete auteur/éditeur =====
  onAuthorInput() {
    clearTimeout(this.authorDebounce);
    this.openAuthor = true;
    const q = (this.model.author || '').trim();
    if (q.length < 2) { this.authorSuggestions = []; return; }
    this.authorDebounce = setTimeout(() => this.fetchNameSuggestions('author', q), 200);
  }
  onAuthorKey(e: KeyboardEvent) {
    if (!this.openAuthor || !this.authorSuggestions.length) return;
    const max = this.authorSuggestions.length - 1;
    if (e.key === 'ArrowDown') { this.activeAuthorIndex = Math.min(max, this.activeAuthorIndex + 1); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { this.activeAuthorIndex = Math.max(0, this.activeAuthorIndex - 1); e.preventDefault(); }
    else if (e.key === 'Enter') { const pick = this.authorSuggestions[this.activeAuthorIndex]; if (pick) this.applyAuthor(pick); e.preventDefault(); }
    else if (e.key === 'Escape') { this.openAuthor = false; }
  }
  applyAuthor(name: string) { this.model.author = name; this.openAuthor = false; }

  onPublisherInput() {
    clearTimeout(this.publisherDebounce);
    this.openPublisher = true;
    const q = (this.model.publisher || '').trim();
    if (q.length < 2) { this.publisherSuggestions = []; return; }
    this.publisherDebounce = setTimeout(() => this.fetchNameSuggestions('publisher', q), 200);
  }
  onPublisherKey(e: KeyboardEvent) {
    if (!this.openPublisher || !this.publisherSuggestions.length) return;
    const max = this.publisherSuggestions.length - 1;
    if (e.key === 'ArrowDown') { this.activePublisherIndex = Math.min(max, this.activePublisherIndex + 1); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { this.activePublisherIndex = Math.max(0, this.activePublisherIndex - 1); e.preventDefault(); }
    else if (e.key === 'Enter') { const pick = this.publisherSuggestions[this.activePublisherIndex]; if (pick) this.applyPublisher(pick); e.preventDefault(); }
    else if (e.key === 'Escape') { this.openPublisher = false; }
  }
  applyPublisher(name: string) { this.model.publisher = name; this.openPublisher = false; }

  private fetchNameSuggestions(kind: 'author' | 'publisher', q: string) {
    const dto: any = kind === 'author' ? { author: q } : { publisher: q };
    this.booksApi.search(dto).subscribe({
      next: (items: any[]) => {
        const names = new Set<string>();
        for (const b of items ?? []) {
          const n = kind === 'author'
            ? (b?.author ?? b?.authorName)
            : (b?.publisher ?? b?.editorName ?? b?.publisherName);
          if (typeof n === 'string' && n.trim()) names.add(n.trim());
          if (Array.isArray(n)) for (const x of n) if (typeof x === 'string' && x.trim()) names.add(x.trim());
        }
        const list = Array.from(names).sort((a, b) => a.localeCompare(b)).slice(0, 10);
        if (kind === 'author') { this.authorSuggestions = list; this.activeAuthorIndex = 0; }
        else { this.publisherSuggestions = list; this.activePublisherIndex = 0; }
      },
      error: () => {
        if (kind === 'author') this.authorSuggestions = [];
        else this.publisherSuggestions = [];
      }
    });
  }

  // ===== Cascade backend =====
  onFloorChanged() {
    const f = Number(this.model.floor);
    if (!Number.isFinite(f)) {
      this.aisles = []; this.availableAisles = []; this.filteredAisles = [];
      this.rayons = []; this.availableRayons = []; this.filteredRayons = [];
      this.levels = []; this.availableLevels = []; this.filteredLevels = [];
      return;
    }

    this.booksApi.getAisles(f).subscribe({
      next: rows => {
        this.aisles = [...rows];
        this.availableAisles = [...rows];
        this.filteredAisles = [...rows];
      },
      error: () => { this.aisles = []; this.availableAisles = []; this.filteredAisles = []; }
    });

    this.rayons = []; this.availableRayons = []; this.filteredRayons = [];
    this.levels = []; this.availableLevels = []; this.filteredLevels = [];
  }
  onAisleChanged() {
    const f = Number(this.model.floor);
    const a = (this.model.aisle || '').trim();
    if (!Number.isFinite(f) || !a) {
      this.rayons = []; this.availableRayons = []; this.filteredRayons = [];
      this.levels = []; this.availableLevels = []; this.filteredLevels = [];
      return;
    }

    this.booksApi.getShelves(f, a).subscribe({
      next: rows => {
        this.rayons = rows.map(r => r.name);
        this.availableRayons = [...this.rayons];
        this.filteredRayons = [...this.availableRayons];
      },
      error: () => { this.rayons = []; this.availableRayons = []; this.filteredRayons = []; }
    });

    this.levels = []; this.availableLevels = []; this.filteredLevels = [];
  }
  onRayonChanged() {
    const f = Number(this.model.floor);
    const a = (this.model.aisle || '').trim();
    const r = (this.model.rayon || '').trim();
    if (!Number.isFinite(f) || !a || !r) {
      this.levels = []; this.availableLevels = []; this.filteredLevels = [];
      return;
    }

    this.booksApi.getShelves(f, a).subscribe({
      next: rows => {
        const found = rows.find(x => x.name.toLowerCase() === r.toLowerCase());
        if (!found) {
          this.levels = []; this.availableLevels = []; this.filteredLevels = [];
          return;
        }
        this.booksApi.getLevels(found.shelfId).subscribe({
          next: lvls => {
            this.levels = [...lvls];
            this.availableLevels = lvls.map(String);
            this.filteredLevels = [...this.availableLevels];
          },
          error: () => { this.levels = []; this.availableLevels = []; this.filteredLevels = []; }
        });
      },
      error: () => { this.levels = []; this.availableLevels = []; this.filteredLevels = []; }
    });
  }

  // ===== Chargement edit =====
  private loadForEdit(id: string) {
    this.booksApi.getById(Number(id)).subscribe({
      next: (b: any) => {
        if (!b) return;

        this.model.title = b.title ?? '';
        this.model.description = b.description ?? '';
        this.model.author = b.author ?? b.authorName ?? '';
        this.model.publisher = b.publisher ?? b.editorName ?? b.publisherName ?? '';
        this.model.isbn = b.isbn ?? '';

        // Ici on reçoit juste l'année -> on fabrique une date
        this.model.publicationDate = b.publicationYear
          ? `${b.publicationYear}-01-01`
          : '';

        // Genres : API renvoie 1 seul nom
        this.model.genres = b.genreName ? [b.genreName] : [];

        // Tags : déjà un tableau de strings
        this.model.tags = Array.isArray(b.tags) ? b.tags : [];

        // Localisation
        this.model.floor   = b.floor ?? null;
        this.model.aisle   = b.aisle ?? '';
        this.model.rayon   = b.rayon ?? '';
        this.model.etagere = b.shelf ?? 1;

        // Synchroniser les inputs liés
        this.floorQuery  = String(this.model.floor ?? '');
        this.aisleQuery  = this.model.aisle;
        this.rayonQuery  = this.model.rayon;
        this.levelQuery  = String(this.model.etagere ?? '');

        // Stock
        this.model.stockQuantity = b.stockQuantity ?? 0;
      },
      error: () => {}
    });
  }

  private toDateInput(v: any): string {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '';
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  // ===== Ensure références & Submit =====
  private ensureRefs() {
    const wantsAuthor = (this.model.author || '').trim();
    const wantsEditor = (this.model.publisher || '').trim();

    return forkJoin({
      author: wantsAuthor ? this.booksApi.ensureAuthor(wantsAuthor).pipe(catchError(() => of(null))) : of(null),
      editor: wantsEditor ? this.booksApi.ensureEditor(wantsEditor).pipe(catchError(() => of(null))) : of(null),
    });
  }
  private ensureAllGenres() {
    const unique = Array.from(new Set(this.model.genres.map(g => (g || '').trim()))).filter(Boolean);
    const calls = unique.map(name =>
      this.booksApi.ensureGenre(name).pipe(
        map(dto => dto), // dto = { genreId, name }
        catchError(() => of({ genreId: 0, name }))
      )
    );
    return calls.length ? forkJoin(calls) : of([]);
  }

  private ensureAllTags() {
    const unique = Array.from(new Set(this.model.tags.map(t => (t || '').trim()))).filter(Boolean);
    const calls = unique.map(name =>
      this.booksApi.ensureTag(name).pipe(
        map(dto => dto), // dto = { tagId, name }
        catchError(() => of({ tagId: 0, name }))
      )
    );
    return calls.length ? forkJoin(calls) : of([]);
  }

  /**
   * Handles form submission (create or update a book).
   * - Ensures new genres/tags entered by user are added
   * - Resolves author/editor/genres/tags references with the backend
   * - Builds a final payload object
   * - Calls create or update API depending on mode
   */
  onSubmit() {
    // If the user typed a new genre not yet created, add it to the model
    if (this.canCreateGenre()) {
      this.model.genres = [...this.model.genres, this.genreQuery.trim()];
      this.genreQuery = '';
    }

    // If the user typed a new tag not yet created, add it to the model
    if (this.canCreateTag()) {
      this.model.tags = [...this.model.tags, this.tagQuery.trim()];
      this.tagQuery = '';
    }

    // Ensure references (author / editor) exist in backend
    this.ensureRefs().subscribe({
      next: refs => {
        // In parallel, ensure all genres and tags exist
        forkJoin({
          finalGenres: this.ensureAllGenres(),
          finalTags: this.ensureAllTags()
        }).subscribe({
          next: ({ finalGenres, finalTags }) => {
            // Choose the first genre ID if available, otherwise default to 0
            const chosenGenreId =
              Array.isArray(finalGenres) && finalGenres.length > 0
                ? finalGenres[0].genreId
                : 0;

            // Collect all tag IDs if available
            const tagIds =
              Array.isArray(finalTags) && finalTags.length > 0
                ? finalTags.map(t => t.tagId)
                : [];

            // Check if a complete location was provided (aisle, shelf, level)
            const hasLoc =
              this.model.aisle.trim() &&
              this.model.rayon.trim() &&
              Number.isFinite(+this.model.etagere);

            // Build location DTO if data is complete
            const locDto = hasLoc
              ? {
                floorNumber: Number(this.model.floor) || 0,
                aisleCode: this.model.aisle.trim(),
                shelfName: this.model.rayon.trim(),
                levelNumber: Number(this.model.etagere) || 1
              }
              : null;

            // Build common payload
            const payload: any = {
              title: this.model.title,
              description: this.model.description || null,
              isbn: this.model.isbn,
              publicationDate: this.model.publicationDate || null,

              authorId: refs.author?.authorId ?? 0,
              editorId: refs.editor?.editorId ?? 0,
              genreId: chosenGenreId,

              shelfLevelId: null,
              location: locDto,
              coverUrl: null,
              tagIds: tagIds,

              stockQuantity: Number.isFinite(+this.model.stockQuantity)
                ? +this.model.stockQuantity
                : null
            };

            // Update existing book if in "edit" mode
            if (this.mode === 'edit' && this.editId) {
              payload.bookId = Number(this.editId);

              console.log('Payload UPDATE :', payload);
              this.booksApi.updateBook(payload.bookId, payload).subscribe({
                next: () => this.router.navigate(['/catalogue/management']),
                error: err => {
                  console.error('Book update error:', err);
                  this.router.navigate(['/catalogue/management']);
                }
              });
            }
            // Otherwise, create a new book
            else {
              console.log('Payload CREATE :', payload);
              this.booksApi.createBook(payload).subscribe({
                next: () => this.router.navigate(['/catalogue/management']),
                error: err => {
                  console.error('Book creation error:', err);
                  this.router.navigate(['/catalogue/management']);
                }
              });
            }
          },
          error: () => this.router.navigate(['/catalogue/management'])
        });
      },
      error: () => this.router.navigate(['/catalogue/management'])
    });
  }

  /**
   * Host listener to close all dropdowns when clicking outside.
   */
  @HostListener('document:click')
  onDocClick() {
    this.openGenres = false;
    this.openTags = false;
    this.openAuthor = false;
    this.openPublisher = false;
    this.openFloors = false;
    this.openAisles = false;
    this.openRayons = false;
    this.openLevels = false;
  }

  // ===== Keyboard navigation for dropdowns =====

  /**
   * Keyboard navigation for "Floors" dropdown
   */
  onFloorInputKey(e: KeyboardEvent) {
    const max = this.filteredFloors.length - 1;
    if (e.key === 'ArrowDown') {
      this.activeFloorIndex = Math.min(max, this.activeFloorIndex + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      this.activeFloorIndex = Math.max(0, this.activeFloorIndex - 1);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const pick = this.filteredFloors[this.activeFloorIndex];
      if (pick) this.applyFloor(pick);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this.openFloors = false;
      e.preventDefault();
    }
  }

  /**
   * Keyboard navigation for "Aisles" dropdown
   */
  onAisleInputKey(e: KeyboardEvent) {
    const max = this.filteredAisles.length - 1;
    if (e.key === 'ArrowDown') {
      this.activeAisleIndex = Math.min(max, this.activeAisleIndex + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      this.activeAisleIndex = Math.max(0, this.activeAisleIndex - 1);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const pick = this.filteredAisles[this.activeAisleIndex];
      if (pick) this.applyAisle(pick);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this.openAisles = false;
      e.preventDefault();
    }
  }

  /**
   * Keyboard navigation for "Rayons" (shelves) dropdown
   */
  onRayonInputKey(e: KeyboardEvent) {
    const max = this.filteredRayons.length - 1;
    if (e.key === 'ArrowDown') {
      this.activeRayonIndex = Math.min(max, this.activeRayonIndex + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      this.activeRayonIndex = Math.max(0, this.activeRayonIndex - 1);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const pick = this.filteredRayons[this.activeRayonIndex];
      if (pick) this.applyRayon(pick);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this.openRayons = false;
      e.preventDefault();
    }
  }

  /**
   * Keyboard navigation for "Levels" dropdown
   */
  onLevelInputKey(e: KeyboardEvent) {
    const max = this.filteredLevels.length - 1;
    if (e.key === 'ArrowDown') {
      this.activeLevelIndex = Math.min(max, this.activeLevelIndex + 1);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      this.activeLevelIndex = Math.max(0, this.activeLevelIndex - 1);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      const pick = this.filteredLevels[this.activeLevelIndex];
      if (pick) this.applyLevel(pick);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      this.openLevels = false;
      e.preventDefault();
    }
  }
}

