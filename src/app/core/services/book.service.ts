import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environment';

// ==================== BOOK DTOs ====================

/** Represents a book entity returned by the API */
export interface Book {
  bookId: number;
  title: string;
  isbn: string;
  publicationYear: number;
  authorName: string;
  genreName: string;
  editorName: string;
  isAvailable: boolean;
  coverUrl?: string | null;
  tags: string[];
  description?: string | null;
  floor?: number | null;
  aisle?: string | null;
  rayon?: string | null;
  shelf?: number | null;
}

/** Paginated response for books */
interface PaginatedBooks {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: Book[];
}

/** DTO for searching books */
export interface BookSearchDto {
  title?: string;
  author?: string;
  publisher?: string;
  genre?: string;
  isbn?: string;
  yearMin?: number;
  yearMax?: number;
  isAvailable?: boolean;
  tagIds?: number[];
  tagNames?: string[];
  description?: string;
  exclude?: string;
}

// ==================== OTHER DTOs ====================

export interface AuthorReadDto { authorId: number; name: string; }
export interface EditorReadDto { editorId: number; name: string; }
export interface GenreReadDto  { genreId: number;  name: string; }
export interface TagReadDto    { tagId: number;    name: string; }

// ==================== LOCATION DTOs ====================

export interface FloorReadDto   { floorNumber: number; }
export interface AisleReadDto   { aisleCode: string; }
export interface ShelfMiniReadDto { shelfId: number; name: string; }
export interface LevelReadDto   { levelNumber: number; }

/** DTO used to create or ensure a location exists */
export interface LocationEnsureDto {
  floorNumber: number;
  aisleCode: string;
  shelfName: string;   // rayon
  levelNumber: number; // étagère
}

/** Location information returned by API */
export interface LocationReadDto extends LocationEnsureDto {
  zoneId: number;
  shelfId: number;
  shelfLevelId: number;
}

// ==================== SERVICE ====================

/**
 * Service to interact with the book API.
 * ------------------------
 * Handles:
 *  - CRUD operations for books
 *  - Searching books
 *  - Genres, authors, editors, tags
 *  - Location management (floors, aisles, shelves, levels)
 */
@Injectable({ providedIn: 'root' })
export class BookService {
  private apiUrl       = `${environment.apiBase}/api/v1/books`;
  private apiAuthors   = `${environment.apiBase}/api/v1/authors`;
  private apiEditors   = `${environment.apiBase}/api/v1/editors`;
  private apiGenres    = `${environment.apiBase}/api/v1/genres`;
  private apiTags      = `${environment.apiBase}/api/v1/tags`;
  private apiLocations = `${environment.apiBase}/api/v1/locations`;

  constructor(private http: HttpClient) {}

  // ===== BOOKS ==============================================================

  /** Fetch the latest N books sorted by BookId descending */
  getLatest(count = 3): Observable<Book[]> {
    const params = new HttpParams()
      .set('pageNumber', '1')
      .set('pageSize', count.toString())
      .set('sortBy', 'BookId')
      .set('ascending', 'false');

    return this.http.get<PaginatedBooks>(this.apiUrl, { params })
      .pipe(map(r => r.items));
  }

  /** Search books using search DTO */
  search(dto: BookSearchDto): Observable<Book[]> {
    return this.http.post<Book[]>(`${this.apiUrl}/search`, dto);
  }

  /** Get a single book by its ID */
  getById(id: string | number) {
    return this.http.get<Book>(`${this.apiUrl}/${id}`);
  }

  /** Create a new book */
  createBook(payload: any) {
    return this.http.post(`${this.apiUrl}`, payload);
  }

  /** Update an existing book */
  updateBook(id: number, payload: any) {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  // ===== GENRES =============================================================

  /** Get all genres as string array */
  getGenres(): Observable<string[]> {
    return this.http.get<GenreReadDto[]>(this.apiGenres)
      .pipe(map(list => (list ?? []).map(g => g.name)));
  }

  /** Search genres with optional limit */
  searchGenres(query: string, take = 12) {
    const params = new HttpParams().set('search', query).set('take', String(take));
    return this.http.get<GenreReadDto[]>(`${this.apiGenres}/search`, { params });
  }

  /** Ensure a genre exists, creating if necessary */
  ensureGenre(name: string) {
    return this.http.post<GenreReadDto>(`${this.apiGenres}/ensure`, { name });
  }

  // ===== AUTHORS ============================================================

  /** Search authors with optional limit */
  searchAuthors(query: string, take = 8) {
    const params = new HttpParams().set('search', query).set('take', String(take));
    return this.http.get<AuthorReadDto[]>(`${this.apiAuthors}/search`, { params });
  }

  /** Ensure an author exists, creating if necessary */
  ensureAuthor(name: string) {
    return this.http.post<AuthorReadDto>(`${this.apiAuthors}/ensure`, { name });
  }

  // ===== EDITORS ============================================================

  /** Search editors with optional limit */
  searchEditors(query: string, take = 8) {
    const params = new HttpParams().set('search', query).set('take', String(take));
    return this.http.get<EditorReadDto[]>(`${this.apiEditors}/search`, { params });
  }

  /** Ensure an editor exists, creating if necessary */
  ensureEditor(name: string) {
    return this.http.post<EditorReadDto>(`${this.apiEditors}/ensure`, { name });
  }

  // ===== TAGS ===============================================================

  /** Get all tags as string array */
  getTags(): Observable<string[]> {
    return this.http.get<TagReadDto[]>(this.apiTags)
      .pipe(map(list => (list ?? []).map(t => t.name)));
  }

  /** Search tags with optional limit */
  searchTags(query: string, take = 12) {
    const params = new HttpParams().set('search', query).set('take', String(take));
    return this.http.get<TagReadDto[]>(`${this.apiTags}/search`, { params });
  }

  /** Ensure a tag exists, creating if necessary */
  ensureTag(name: string) {
    return this.http.post<TagReadDto>(`${this.apiTags}/ensure`, { name });
  }

  // ===== LOCATIONS ==========================================================

  /** Get all floors */
  getFloors(): Observable<string[]> {
    return this.http.get<FloorReadDto[]>(`${this.apiLocations}/floors`)
      .pipe(map(list => (list ?? []).map(f => String(f.floorNumber))));
  }

  /** Get all aisles for a given floor */
  getAisles(floor: number): Observable<string[]> {
    const params = new HttpParams().set('floor', String(floor));
    return this.http.get<AisleReadDto[]>(`${this.apiLocations}/aisles`, { params })
      .pipe(map(list => (list ?? []).map(a => a.aisleCode)));
  }

  /** Get all shelves for a given floor and aisle */
  getShelves(floor: number, aisle: string): Observable<ShelfMiniReadDto[]> {
    const params = new HttpParams().set('floor', String(floor)).set('aisle', aisle);
    return this.http.get<ShelfMiniReadDto[]>(`${this.apiLocations}/shelves`, { params });
  }

  /** Get all levels for a given shelf */
  getLevels(shelfId: number): Observable<number[]> {
    const params = new HttpParams().set('shelfId', String(shelfId));
    return this.http.get<LevelReadDto[]>(`${this.apiLocations}/levels`, { params })
      .pipe(map(list => (list ?? []).map(l => l.levelNumber)));
  }

  /** Ensure a location exists, creating it if necessary */
  ensureLocation(dto: LocationEnsureDto): Observable<LocationReadDto> {
    return this.http.post<LocationReadDto>(`${this.apiLocations}/ensure`, dto);
  }
}





