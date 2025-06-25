import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-team-presentation',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './team-presentation.component.html',
  styleUrls: ['./team-presentation.component.scss']
})
export class TeamPresentationComponent {}
