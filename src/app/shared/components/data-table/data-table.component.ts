import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;             // ex: "title", "date"
  label: string;           // ex: "Titre du livre"
  width?: string;          // optionnel: largeur de la colonne
}

export interface TableAction<T = any> {
  icon: string;            // chemin ou classe d’icône
  label: string;           // label accessible
  handler: (row: T) => void; // callback quand on clique
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent<T extends Record<string, any> = any> {
  @Input() columns: TableColumn[] = [];
  @Input() data: T[] = [];
  @Input() actions: TableAction<T>[] = [];

  /** Récupère la valeur d'une colonne pour une ligne */
  getValue(row: T, col: TableColumn): any {
    return row[col.key];
  }
}



