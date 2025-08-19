import { Component } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';
import { CtaButtonComponent } from '../../../../shared/components/cta-button/cta-button.component';

import { TeamPresentationComponent } from '../../../home/components/team-presentation/team-presentation.component'; // ajuste le chemin si besoin

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [
    CommonModule, RouterModule, NgOptimizedImage,
    HeaderComponent, FooterComponent, SectionTitleComponent, CtaButtonComponent,
    TeamPresentationComponent
  ],
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss']
})
export class AboutPageComponent {}
