import { Component, OnDestroy, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { BookService, Book } from '../../../../core/services/book.service';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { LoansService, LoanCreateResponse } from '../../../../core/services/loan.service';
import { ReservationsService } from '../../../../core/services/reservations.service';
import { AuthService } from '../../../../core/services/auth.service';

// Supported share platforms
type SharePlatform = 'x' | 'facebook' | 'linkedin' | 'whatsapp' | 'email';

@Component({
  standalone: true,
  selector: 'app-book-details-page',
  imports: [CommonModule, RouterModule, NgOptimizedImage, SectionTitleComponent],
  templateUrl: './book-details-page.component.html',
  styleUrls: ['./book-details-page.component.scss'],
})
export class BookDetailsPageComponent implements OnInit, OnDestroy {
  // ===== Dependency injection =====
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private api: BookService = inject(BookService);
  private loans: LoansService = inject(LoansService);
  private reservations: ReservationsService = inject(ReservationsService);
  auth: AuthService = inject(AuthService);

  // ===== Template bindings =====
  isAuthenticated$ = this.auth.isAuthenticated$;

  // ===== Signals for component state =====
  book = signal<Book | any | null>(null);
  loading = signal(false);
  notFound = signal(false);

  shareOpen = signal(false);
  borrowing = signal(false);

  // Reservation state
  reserving = signal(false);
  hasReserved = signal(false);

  // Loan state
  hasActiveLoan = signal(false);
  loanDue = signal<Date | null>(null);

  // Toast notifications
  toast = signal<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  private sub?: Subscription;

  // ===== Lifecycle hooks =====
  ngOnInit(): void {
    // Subscribe to route params and load the book by ID
    this.sub = this.route.paramMap.subscribe(pm => {
      const idStr = pm.get('id');
      const id = idStr ? Number(idStr) : NaN;
      if (!Number.isFinite(id)) { this.markNotFound(); return; }
      this.shareOpen.set(false);
      this.fetch(id);
    });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  // Close share modal when pressing Escape
  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.shareOpen()) {this.shareOpen.set(false);} }

  // ===== Data loading =====
  private fetch(id: number): void {
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: b => {
        this.book.set(b ?? null);
        this.notFound.set(!b);
        this.loading.set(false);
        this.refreshReservationFlag();
        this.refreshActiveLoanFlag(); // Also check active loan state
      },
      error: err => {
        console.error('Book load error', err);
        this.markNotFound();
      },
    });
  }
  private markNotFound(): void { this.book.set(null); this.notFound.set(true); this.loading.set(false); }

  // Check if the user has already reserved this book
  private refreshReservationFlag(): void {
    const b: any = this.book();
    if (!b || !this.auth.isAuthenticated()) { this.hasReserved.set(false); return; }
    const bookId = Number(b?.bookId ?? b?.id);
    if (!Number.isFinite(bookId)) {return;}
    this.reservations.hasForCurrentUser(bookId)
      .subscribe((v: boolean) => this.hasReserved.set(v));
  }

  // Check if the user has an active loan for this book
  private refreshActiveLoanFlag(): void {
    const b: any = this.book();
    if (!b || !this.auth.isAuthenticated()) { this.hasActiveLoan.set(false); this.loanDue.set(null); return; }
    const bookId = Number(b?.bookId ?? b?.id);
    if (!Number.isFinite(bookId)) {return;}

    this.loans.hasActiveForCurrentUser?.(bookId).subscribe({
      next: r => {
        const active = !!r?.hasActive;
        this.hasActiveLoan.set(active);
        this.loanDue.set(active && r?.dueDate ? new Date(r.dueDate) : null);
      },
      error: () => {
        // Do not block UI in case of error
        this.hasActiveLoan.set(false);
        this.loanDue.set(null);
      }
    });
  }

  // ===== Helper methods =====
  private safe(v: any): string { if (v == null) {return '—';} const s = String(v); return s.trim() === '' ? '—' : s; }
  private pick(...c: any[]) { for (const x of c){ if (x==null) {continue;} const s=typeof x==='string'?x.trim():String(x); if (s!=='') {return s;} } return undefined; }
  private nested(){ const b:any=this.book()??{}; const sl=b.shelfLevel??b.stock?.shelfLevel??null; const s=sl?.shelf??null; const z=s?.zone??null; return {shelfLevel:sl,shelf:s,zone:z}; }

  // Extract fields for template
  title(): string { return (this.book() as any)?.title ?? ''; }
  description(): string { const b:any=this.book(); return b?.description ?? b?.desc ?? ''; }
  isAvailable(): boolean {
    const b:any=this.book();
    return !!(b?.isAvailable ?? b?.available ?? b?.inStock ?? (b?.stock?.quantity ?? 0) > 0);
  }
  availabilityLabel(): string { return this.isAvailable() ? 'Disponible' : 'Indisponible'; }
  coverUrl(): string | null { const b:any=this.book(); return b?.coverUrl ?? b?.cover ?? b?.imageUrl ?? null; }
  isbn(): string { const b:any=this.book(); return b?.isbn ?? b?.ISBN ?? b?.isbn13 ?? b?.isbn10 ?? '—'; }
  author(): string {
    const b:any=this.book();
    const v=b?.authorName ?? b?.author ?? (Array.isArray(b?.authors)? b.authors.join(', '): b?.authors);
    return v || '—';
  }
  publisher(): string { const b:any=this.book(); return b?.editorName ?? b?.publisher ?? b?.publisherName ?? b?.editor ?? '—'; }
  date(): string {
    const b:any=this.book();
    const raw=b?.publicationYear ?? b?.publishDate ?? b?.publicationDate ?? b?.datePublished ?? b?.releaseDate ?? b?.year;
    if (!raw) {return '—';}
    if (typeof raw==='number' && raw>0) {return String(raw);}
    if (/^\d{4}$/.test(String(raw))) {return String(raw);}
    const d=new Date(raw); return Number.isNaN(d.getTime())? String(raw): d.toLocaleDateString();
  }
  genres(): string {
    const b:any=this.book();
    const g=b?.genreName ?? b?.genre ?? b?.genres ?? b?.category ?? b?.categories;
    return Array.isArray(g)? g.join(', '): (g || '—');
  }
  taglist(): string {
    const b:any=this.book(); if (!b) {return '—';}
    const list:string[]=[
      ...(Array.isArray(b.tags)? b.tags: []),
      ...(Array.isArray(b.tagNames)? b.tagNames: []),
      ...(Array.isArray(b.bookTags)? b.bookTags.map((t:any)=> t?.tag?.name ?? t?.name ?? t?.tagName ?? '').filter(Boolean): []),
    ];
    return list.length ? list.join(', ') : '—';
  }
  floor(): string { const b:any=this.book(); const {zone}=this.nested(); const v=this.pick(b?.floor, b?.location?.floor, zone?.floorNumber); return this.safe(v); }
  aisle(): string { const b:any=this.book(); const {zone}=this.nested(); const v=this.pick(b?.aisle, b?.location?.aisle, zone?.aisleCode); return this.safe(v); }
  rayon(): string { const b:any=this.book(); const {shelf}=this.nested(); const v=this.pick(b?.rayon, b?.location?.rayon, shelf?.name); return this.safe(v); }
  shelf(): string { const b:any=this.book(); const {shelfLevel}=this.nested(); const v=this.pick(b?.shelf, b?.location?.shelf, shelfLevel?.levelNumber); return this.safe(v); }

  // ===== Sharing =====
  private absoluteUrl(): string { return new URL(this.router.url, location.origin).toString(); }

  async share(): Promise<void> {
    const url=this.absoluteUrl(), title=this.title(), text=`${title}${this.author() ? ' — ' + this.author() : ''}`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title, text, url }); this.shareOpen.set(false); return; }
      catch (e:any){ if (e?.name!=='AbortError') {console.warn('native share failed', e);} }
    }
    this.shareOpen.set(true);
  }
  closeShare(): void { this.shareOpen.set(false); }
  shareHref(p: SharePlatform): string {
    const url = encodeURIComponent(this.absoluteUrl());
    const title = encodeURIComponent(this.title());
    const text = encodeURIComponent(`${this.title()}${this.author() ? ' — ' + this.author() : ''}`);
    switch (p) {
      case 'x':        return `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
      case 'facebook': return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      case 'linkedin': return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      case 'whatsapp': return `https://api.whatsapp.com/send?text=${text}%20${url}`;
      case 'email':    return `mailto:?subject=${title}&body=${text}%0A%0A${url}`;
    }
  }
  async copyLink(): Promise<void> {
    const url = this.absoluteUrl();
    try { await navigator.clipboard.writeText(url); this.showToast('Lien copié dans le presse-papiers.', 'info'); }
    catch { prompt('Copier le lien :', url); }
  }

  // ===== Error translation (backend → French) =====
  private translateMessage(input?: string | null): string {
    const msg = (input ?? '').toString().trim();
    if (!msg) {return '';}

    const table: [RegExp, ((...m: string[]) => string) | string][] = [
      // Loans
      [/maximum\s+active\s+loans?\s*\((\d+)\)\s*reached/i, (_all, n) => `Nombre maximum d’emprunts actifs (${n}) atteint.`],
      [/existing\s+active\s+loan/i, 'Vous avez déjà un emprunt actif pour ce livre.'],
      [/book\s+unavailable|no\s+copies?\s+available|no\s+copy\s+available/i, 'Aucun exemplaire disponible.'],
      [/invalid\s+user|user\s+mismatch/i, 'Utilisateur invalide.'],
      [/user\s+not\s+found/i, 'Utilisateur introuvable.'],

      // Reservations
      [/existing\s+active\s+reservation/i, 'Vous avez déjà une réservation active pour ce livre.'],

      // Generic backend errors
      [/internal\s*error|internalerror/i, 'Erreur interne. Veuillez réessayer plus tard.'],
      [/forbidden/i, 'Action non autorisée.'],
      [/unauthori[sz]ed/i, 'Authentification requise.']
    ];

    for (const [re, out] of table) {
      const m = msg.match(re);
      if (m) {return typeof out === 'string' ? out : out(...m);}
    }
    return msg; // Fallback: return original message
  }

  private showToast(message: string, type: 'success'|'error'|'info' = 'success') {
    this.toast.set({ type, message });
    setTimeout(() => { if (this.toast()?.message === message) {this.toast.set(null);} }, 4000);
  }

  // ===== Borrow a book =====
  borrow(): void {
    if (this.borrowing() || this.hasActiveLoan()) {return;}
    const b: any = this.book();
    const bookId = Number(b?.bookId ?? b?.id);
    if (!Number.isFinite(bookId)) { this.showToast('Livre introuvable.', 'error'); return; }
    if (!this.isAvailable()) { this.showToast('Livre indisponible.', 'error'); return; }

    this.borrowing.set(true);
    this.loans.createLoanForCurrentUser(bookId).subscribe({
      next: (resp: LoanCreateResponse) => {
        const due = resp?.dueDate ? new Date(resp.dueDate) : null;
        this.loanDue.set(due);
        this.hasActiveLoan.set(true);

        this.fetch(bookId); // Reload book to refresh availability

        this.showToast(
          due ? `Emprunt créé ! Retour avant le ${due.toLocaleDateString()}.` : 'Emprunt créé !',
          'success'
        );
        this.borrowing.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Loan error', err);
        this.borrowing.set(false);

        if (err.status === 401) { this.showToast('Connectez-vous pour emprunter ce livre.', 'error'); return; }
        if (err.status === 403) { this.showToast('Vous n’êtes pas autorisé à emprunter ce livre.', 'error'); return; }

        const raw =
          (typeof err.error?.error === 'string' && err.error.error) ||
          (typeof err.error?.details === 'string' && err.error.details) ||
          err.message;
        const fr = this.translateMessage(raw) || 'Impossible d’emprunter ce livre pour le moment.';
        this.showToast(fr, 'error');
      }
    });
  }

  // ===== Reserve a book =====
  reserve(): void {
    if (this.reserving() || this.hasReserved()) {return;}
    const b: any = this.book();
    const bookId = Number(b?.bookId ?? b?.id);
    if (!Number.isFinite(bookId)) { this.showToast('Livre introuvable.', 'error'); return; }
    if (this.isAvailable()) { this.showToast('Le livre est disponible : empruntez-le directement.', 'info'); return; }

    this.reserving.set(true);
    this.reservations.createForCurrentUser(bookId).subscribe({
      next: _dto => {
        this.reserving.set(false);
        this.hasReserved.set(true);
        this.showToast('Réservation enregistrée. Vous serez notifié quand un exemplaire sera disponible.', 'success');
      },
      error: (err: HttpErrorResponse) => {
        console.error('Reservation error', err);
        this.reserving.set(false);

        if (err.status === 401) { this.showToast('Connectez-vous pour réserver ce livre.', 'error'); return; }
        if (err.status === 403) { this.showToast('Action non autorisée.', 'error'); return; }

        const raw =
          (typeof err.error?.error === 'string' && err.error.error) ||
          (typeof err.error?.details === 'string' && err.error.details) ||
          err.message;
        const fr = this.translateMessage(raw) || 'Impossible de créer la réservation pour le moment.';
        this.showToast(fr, 'error');
      }
    });
  }
}
