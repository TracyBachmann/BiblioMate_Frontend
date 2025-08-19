import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { SectionTitleComponent } from '../../../../shared/components/section-title/section-title.component';



@Component({
  selector: 'app-legal-notice-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent, SectionTitleComponent],
  templateUrl: './legal-notice-page.component.html',
  styleUrls: ['./legal-notice-page.component.scss']
})
export class LegalNoticePageComponent {}
