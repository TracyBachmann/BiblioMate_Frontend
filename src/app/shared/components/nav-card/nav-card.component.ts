import { Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-nav-card',
  standalone: true,
  imports: [CommonModule, RouterModule, NgOptimizedImage],
  templateUrl: './nav-card.component.html',
  styleUrls: ['./nav-card.component.scss'],
})
export class NavCardComponent {
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() image!: string;
  @Input() link: string | any[] = [];
  @Input() ariaLabel?: string;
  @Input() disabled = false;
}
