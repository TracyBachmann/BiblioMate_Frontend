import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environment';   // même import que ton interceptor

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

  // ↓↓↓ nouveaux champs plats renvoyés par l’API
  floor?: number | null;   // Étage
  aisle?: string | null;   // Allée
  rayon?: string | null;   // Rayon
  shelf?: number | null;   // Étagère
}

interface PaginatedBooks {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: Book[];
}

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

@Injectable({ providedIn: 'root' })
export class BookService {
  private apiUrl = `${environment.apiBase}/api/v1/books`;

  constructor(private http: HttpClient) {}

  getLatest(count = 3): Observable<Book[]> {
    const params = new HttpParams()
      .set('pageNumber', '1')
      .set('pageSize', count.toString())
      .set('sortBy', 'BookId')
      .set('ascending', 'false');

    return this.http
      .get<PaginatedBooks>(this.apiUrl, { params })
      .pipe(map(r => r.items));
  }

  search(dto: BookSearchDto): Observable<Book[]> {
    return this.http.post<Book[]>(`${this.apiUrl}/search`, dto);
  }

  getGenres(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/genres`);
  }

  getById(id: string | number) {
    return this.http.get<Book>(`${this.apiUrl}/${id}`); // ← pas de /books/ en trop
  }
}
