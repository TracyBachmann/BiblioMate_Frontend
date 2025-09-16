import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';
import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';
import { BookService, Loan } from '../../../../core/services/book.service';

@Component({
  selector: 'app-notification-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionTitleComponent, DataTableComponent],
  templateUrl: './notification-management.component.html',
  styleUrls: ['./notification-management.component.scss']
})
export class NotificationManagementComponent implements OnInit {
  private booksApi = inject(BookService);

  query = signal<string>('');
  advanced = signal<boolean>(false);

  data = signal<Loan[]>([]);

  // Colonnes de notre tableau
  columns: TableColumn<Loan>[] = [
    { key: 'id', label: 'ID Emprunt' },
    { key: 'bookTitle', label: 'Livre' },
    { key: 'borrowerName', label: 'Emprunteur' },
    { key: 'loanDate', label: 'Date d’emprunt' },
    { key: 'returnDate', label: 'Date de retour' },
    { key: 'status', label: 'Statut' },
  ];

  actions: TableAction<Loan>[] = [
    {
      icon: 'assets/images/icon-remind.svg',
      label: 'Envoyer rappel',
      handler: (row) => this.sendReminder(row)
    }
  ];

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    // appel API fictif – filtre sur retards
    this.booksApi.getOverdueLoans().subscribe(items => {
      this.data.set(items);
    });
  }

  resetAll(): void {
    this.query.set('');
    this.advanced.set(false);
    this.search();
  }

  sendReminder(row: Loan): void {
    console.log('Envoi rappel pour', row);
  }

  editReminderTemplate(): void {
    console.log('Modifier le message de rappel');
  }

  sendBulkReminders(): void {
    console.log('Envoyer rappels à tous');
  }
}
