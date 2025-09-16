import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';

type Reservation = {
  id: string | number;
  title: string;
  coverUrl: string | null;
  description: string;
  reservationDate: string;
  expirationDate: string;
};

@Component({
  standalone: true,
  selector: 'app-my-reservations',
  imports: [CommonModule, FormsModule, NgOptimizedImage, SectionTitleComponent, BookCardComponent],
  templateUrl: './my-reservations.component.html',
  styleUrls: ['./my-reservations.component.scss']
})
export class MyReservationsComponent implements OnInit {
  query = signal<string>('');
  advanced = signal<boolean>(false);
  reservations = signal<Reservation[]>([]);

  ngOnInit(): void {
    // TODO: Appeler ton API de réservations
    this.reservations.set([
      {
        id: 1,
        title: 'Le Petit Prince',
        coverUrl: null,
        description: 'Un classique intemporel.',
        reservationDate: '01/09/2025',
        expirationDate: '15/09/2025'
      },
      {
        id: 2,
        title: 'Les Misérables',
        coverUrl: null,
        description: 'Roman de Victor Hugo.',
        reservationDate: '05/09/2025',
        expirationDate: '20/09/2025'
      }
    ]);
  }

  search(): void {
    const q = this.query().toLowerCase();
    // TODO: brancher avec API
    this.reservations.update(list =>
      list.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
    );
  }

  cancel(id: string | number): void {
    // TODO: appeler l’API d’annulation
    this.reservations.update(list => list.filter(r => r.id !== id));
  }
}