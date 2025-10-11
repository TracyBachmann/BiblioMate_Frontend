import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  width?: string;
}

export interface TableAction<T = any> {
  icon: string;
  label: string;
  handler: (row: T) => void;
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

  getValue(row: T, col: TableColumn): any {
    return row[col.key];
  }
}

