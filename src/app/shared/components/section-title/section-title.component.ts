import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * SectionTitleComponent
 * ------------------------
 * A simple standalone component to display a section header.
 * Uses a level-2 heading with customizable text via the `title` input.
 */
@Component({
  selector: 'app-section-title',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './section-title.component.html',
  styleUrls: ['./section-title.component.scss']
})
export class SectionTitleComponent {
  /**
   * Text displayed inside the <h2> element.
   * Required input.
   */
  @Input() title!: string;
}
