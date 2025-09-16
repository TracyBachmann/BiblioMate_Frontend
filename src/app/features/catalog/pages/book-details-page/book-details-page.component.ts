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

type SharePlatform = 'x' | 'facebook' | 'linkedin' | 'whatsapp' | 'email';

@Component({
  standalone: true,
  selector: 'app-book-details-page',
  imports: [CommonModule, RouterModule, NgOptimizedImage, SectionTitleComponent],
  templateUrl: './book-details-page.component.html',
  styleUrls: ['./book-details-page.component.scss'],
})
export class BookDetailsPageComponent implements OnInit, OnDestroy {
  // services
  private route: ActivatedRoute = inject(ActivatedRoute);
  private router: Router = inject(Router);
  private api: BookService = inject(BookService);
  private loans: LoansService = inject(LoansService);
  private reservations: ReservationsService = inject(ReservationsService);
  auth: AuthService = inject(AuthService);

  // exposé pour le template
  isAuthenticated$ = this.auth.isAuthenticated$;

  // state
  book = signal<Book | any | null>(null);
  loading = signal(false);
  notFound = signal(false);

  shareOpen = signal(false);
  borrowing = signal(false);

  // réservation
  reserving = signal(false);
  hasReserved = signal(false);

  // état “emprunt en cours”
  hasActiveLoan = signal(false);
  loanDue = signal<Date | null>(null);

  // toast
  toast = signal<{type:'success'|'error'|'info', message:string} | null>(null);

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(pm => {
      const idStr = pm.get('id');
      const id = idStr ? Number(idStr) : NaN;
      if (!Number.isFinite(id)) { this.markNotFound(); return; }
      this.shareOpen.set(false);
      this.fetch(id);
    });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  @HostListener('document:keydown.escape')
  onEsc(): void { if (this.shareOpen()) this.shareOpen.set(false); }

  // ======== load ========
  private fetch(id: number): void {
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: b => {
        this.book.set(b ?? null);
        this.notFound.set(!b);
        this.loading.set(false);
        this.refreshReservationFlag();
        this.refreshActiveLoanFlag(); // 👈 récupère l’info depuis le back
      },
      error: err => {
        console.error('Book load error', err);
        this.markNotFound();
      },
    });
  }
  private markNotFound(): void { this.book.set(null); this.notFound.set(true); this.loading.set(false); }

  private refreshReservationFlag(): void {
    const b: any = this.book();
    if (!b || !this.auth.isAuthenticated()) { this.hasReserved.set(false); return; }
    const bookId = Number(b?.bookId ?? b?.id);
    if (!Number.isFinite(bookId)) return;
    this.reservations.hasForCurrentUser(bookId).subscribe(v => this.hasReserved.set(v));
  }

  private refreshActiveLoanFlag(): void {
    const b: any = this.book();
    if (!b || !this.auth.isAuthenticated()) { this.hasActiveLoan.set(false); this.loanDue.set(null); return; }
    const bookId = Number(b?.bookId ?? b?.id);
    if (!Number.isFinite(bookId)) return;
    this.loans.hasActiveForCurrentUser(bookId).subscribe({
      next: r => {
        const active = !!r?.hasActive;
        this.hasActiveLoan.set(active);
        this.loanDue.set(active && r?.dueDate ? new Date(r.dueDate) : null);
      },
      error: () => {
        // en cas d'erreur, ne bloque pas l’UI, on considère "pas d’emprunt actif"
        this.hasActiveLoan.set(false);
        this.loanDue.set(null);
      }
    });
  }

  // ======== helpers ========
  private safe(v: any): string { if (v == null) return '—'; const s = String(v); return s.trim() === '' ? '—' : s; }
  private pick(...c: any[]) { for (const x of c){ if (x==null) continue; const s=typeof x==='string'?x.trim():String(x); if (s!=='') return s; } return undefined; }
  private nested(){ const b:any=this.book()??{}; const sl=b.shelfLevel??b.stock?.shelfLevel??null; const s=sl?.shelf??null; const z=s?.zone??null; return {shelfLevel:sl,shelf:s,zone:z}; }

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
    if (!raw) return '—';
    if (typeof raw==='number' && raw>0) return String(raw);
    if (/^\d{4}$/.test(String(raw))) return String(raw);
    const d=new Date(raw); return Number.isNaN(d.getTime())? String(raw): d.toLocaleDateString();
  }
  genres(): string {
    const b:any=this.book();
    const g=b?.genreName ?? b?.genre ?? b?.genres ?? b?.category ?? b?.categories;
    return Array.isArray(g)? g.join(', '): (g || '—');
  }
  taglist(): string {
    const b:any=this.book(); if (!b) return '—';
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

  // ======== partage ========
  private absoluteUrl(): string { return new URL(this.router.url, location.origin).toString(); }
  async share(): Promise<void> {
    const url=this.absoluteUrl(), title=this.title(), text=`${title}${this.author() ? ' — ' + this.author() : ''}`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title, text, url }); this.shareOpen.set(false); return; }
      catch (e:any){ if (e?.name!=='AbortError') console.warn('native share failed', e); }
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

  private showToast(message: string, type: 'success'|'error'|'info' = 'success') {
    this.toast.set({ type, message });
    setTimeout(() => { if (this.toast()?.message === message) this.toast.set(null); }, 4000);
  }

  // ======== Emprunter ========
  borrow(): void {
    if (this.borrowing() || this.hasActiveLoan()) return;
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

        // met à jour le stock local
        const copy: any = { ...(this.book() as any) };
        const currentQty = Number(copy?.stock?.quantity ?? 0);
        const newQty = Math.max(0, currentQty - 1);
        copy.stock = { ...(copy.stock ?? {}), quantity: newQty, isAvailable: newQty > 0 };
        copy.isAvailable = newQty > 0;
        this.book.set(copy);

        this.showToast(
          due ? `Emprunt créé ! Retour avant le ${due.toLocaleDateString()}.` : 'Emprunt créé !',
          'success'
        );
        this.borrowing.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Loan error', err);
        this.borrowing.set(false);
        if (err.status === 401) this.showToast('Connectez-vous pour emprunter ce livre.', 'error');
        else if (err.status === 403) this.showToast('Vous n’êtes pas autorisé à emprunter ce livre.', 'error');
        else if (typeof err.error?.error === 'string') this.showToast(err.error.error, 'error');
        else if (typeof err.error?.details === 'string') this.showToast(err.error.details, 'error');
        else this.showToast('Impossible d’emprunter ce livre pour le moment.', 'error');
      }
    });
  }

  // ======== Réserver ========
  reserve(): void {
    if (this.reserving() || this.hasReserved()) return;
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
        if (err.status === 401) this.showToast('Connectez-vous pour réserver ce livre.', 'error');
        else if (err.status === 403) this.showToast('Action non autorisée.', 'error');
        else if (typeof err.error?.error === 'string') this.showToast(err.error.error, 'error');
        else this.showToast('Impossible de créer la réservation pour le moment.', 'error');
      }
    });
  }
}
