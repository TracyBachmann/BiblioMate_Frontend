import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { BookCardComponent } from '../../../../shared/components/book-card/book-card.component';

type Loan = {
  id: string | number;
  title: string;
  coverUrl: string | null;
  description: string;
  loanDate: string;
  returnDate: string;
};

@Component({
  standalone: true,
  selector: 'app-my-loans',
  imports: [CommonModule, FormsModule, NgOptimizedImage, SectionTitleComponent, BookCardComponent],
  templateUrl: './my-loans.component.html',
  styleUrls: ['./my-loans.component.scss']
})
export class MyLoansComponent implements OnInit {
  query = signal<string>('');
  advanced = signal<boolean>(false);
  loans = signal<Loan[]>([]);

  ngOnInit(): void {
    // TODO: Appeler ton API d’emprunts
    this.loans.set([
      {
        id: 1,
        title: '1984',
        coverUrl: null,
        description: 'Roman dystopique de George Orwell.',
        loanDate: '01/09/2025',
        returnDate: '20/09/2025'
      },
      {
        id: 2,
        title: 'Harry Potter à l\'école des sorciers',
        coverUrl: null,
        description: 'Premier tome de la saga Harry Potter.',
        loanDate: '05/09/2025',
        returnDate: '25/09/2025'
      }
    ]);
  }

  search(): void {
    const q = this.query().toLowerCase();
    this.loans.update(list =>
      list.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q))
    );
  }

  extend = (id: string | number): void => {
    // TODO: appeler l’API pour prolonger l’emprunt
    alert(`Emprunt ${id} prolongé !`);
  };
}
