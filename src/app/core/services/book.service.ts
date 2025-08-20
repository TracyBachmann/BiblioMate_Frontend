import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environment';

export interface Book {
  bookId: number;
  title: string;
  isbn: string;
  publicationYear: number;
  authorName: string;
  genreName: string;
  editorName: string;
  isAvailable: boolean;
  coverUrl?: string;
  tags: string[];
  description?: string;
}

interface PaginatedBooks {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: Book[];
}

@Injectable({ providedIn: 'root' })
export class BookService {
  private apiUrl = `${environment.apiBase}/api/v1/books`;  //

  constructor(private http: HttpClient) {}

  getLatest(count = 3): Observable<Book[]> {
    const params = new HttpParams()
      .set('pageNumber', '1')
      .set('pageSize', count.toString())
      .set('sortBy', 'BookId')
      .set('ascending', 'false');

    return this.http
      .get<PaginatedBooks>(this.apiUrl, { params })
      .pipe(
        map(response => response.items)
      );
  }
}
