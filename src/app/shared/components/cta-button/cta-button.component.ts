import { Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-cta-button',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './cta-button.component.html',
  styleUrls: ['./cta-button.component.scss']
})
export class CtaButtonComponent {
  @Input() text!: string;
  @Input() color: 'yellow' | 'blue' = 'yellow';
  @Input() icon?: string; // ex: "info" pour icon-info.svg
}
