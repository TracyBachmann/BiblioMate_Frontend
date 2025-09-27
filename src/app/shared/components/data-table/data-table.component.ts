import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * TableColumn
 * -----------------
 * Defines a single column of the data table.
 */
export interface TableColumn {
  /** Unique key used to retrieve the corresponding value from a row object (e.g. "title", "date"). */
  key: string;

  /** Human-readable column label displayed in the table header. */
  label: string;

  /** Optional fixed width of the column (e.g. "150px", "20%"). */
  width?: string;
}

/**
 * TableAction<T>
 * -----------------
 * Defines an action button that can be displayed per row.
 * Generic parameter `T` represents the row data type.
 */
export interface TableAction<T = any> {
  /** Path or class name for the action icon. */
  icon: string;

  /** Accessible label for the action (used for aria-label and alt text). */
  label: string;

  /**
   * Callback executed when the action button is clicked.
   * @param row The row object associated with the clicked action.
   */
  handler: (row: T) => void;
}

/**
 * DataTableComponent<T>
 * -----------------
 * Generic, reusable data table component.
 * Features:
 * - Dynamic columns
 * - Dynamic rows of data
 * - Optional actions column with configurable buttons
 *
 * Generic parameter `T` allows type safety for row objects.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent<T extends Record<string, any> = any> {
  /**
   * Column definitions describing how to render table headers
   * and how to map row object fields.
   */
  @Input() columns: TableColumn[] = [];

  /**
   * Data to be displayed in the table.
   * Each row is an object where keys must match the column definitions.
   */
  @Input() data: T[] = [];

  /**
   * List of row-level actions.
   * If empty, the actions column is not rendered.
   */
  @Input() actions: TableAction<T>[] = [];

  /**
   * Retrieves the value of a column for a given row.
   * @param row The current row object
   * @param col The column definition
   * @returns The value associated with the column key in the row
   */
  getValue(row: T, col: TableColumn): any {
    return row[col.key];
  }
}




