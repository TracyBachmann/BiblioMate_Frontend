import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { CtaButtonComponent } from '../../../../shared/components/cta-button/cta-button.component';
import { NgOptimizedImage } from '@angular/common';
@Component({
  selector: 'app-library-info-section',
  standalone: true,
  imports: [CommonModule, SectionTitleComponent, CtaButtonComponent, NgOptimizedImage],
  templateUrl: './library-info-section.component.html',
  styleUrls: ['./library-info-section.component.scss']
})
export class LibraryInfoSectionComponent {}
