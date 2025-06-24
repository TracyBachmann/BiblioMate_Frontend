import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero.component';
import { LibraryInfoSectionComponent } from '../../components/library-info-section/library-info-section.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [HeroComponent, LibraryInfoSectionComponent],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent {}
