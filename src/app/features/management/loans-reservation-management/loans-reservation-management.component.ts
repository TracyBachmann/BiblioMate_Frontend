import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SectionTitleComponent } from '../../../shared/components/section-title/section-title.component';
import { DataTableComponent, TableColumn, TableAction } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-notifications-management',
  standalone: true,
  imports: [CommonModule, FormsModule, SectionTitleComponent, DataTableComponent],
  templateUrl: './notifications-management.component.html',
  styleUrls: ['./notifications-management.component.scss']
})
export class NotificationsManagementComponent implements OnInit {
  query = signal<string>('');
  advanced = signal<boolean>(false);

  columns: TableColumn[] = [
    { key: 'id', label: 'ID Emprunt' },
    { key: 'book', label: 'Livre' },
    { key: 'borrower', label: 'Emprunteur' },
    { key: 'loanDate', label: 'Date d’emprunt' },
    { key: 'dueDate', label: 'Date de retour' },
    { key: 'status', label: 'Statut' }
  ];

  rows = [
    { id: 1, book: '1984', borrower: 'Alice', loanDate: '01/09/2023', dueDate: '15/09/2023', status: 'En retard' },
    { id: 2, book: 'Le Petit Prince', borrower: 'Bob', loanDate: '05/09/2023', dueDate: '19/09/2023', status: 'En retard' }
  ];

  actions: TableAction[] = [
    { icon: 'assets/images/icon-mail.svg', label: 'Notifier', handler: row => this.sendReminder(row) },
    { icon: 'assets/images/icon-trash.svg', label: 'Supprimer', handler: row => this.delete(row) }
  ];

  ngOnInit() {
    this.search();
  }

  search() {
    console.log('Recherche en retard:', this.query());
  }

  sendReminder(row: any) {
    console.log('Envoyer un rappel pour', row);
  }

  delete(row: any) {
    console.log('Suppression', row);
  }
}
