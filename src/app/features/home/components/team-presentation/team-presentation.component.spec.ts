import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamPresentationComponent } from './team-presentation.component';

describe('TeamPresentationComponent', () => {
  let component: TeamPresentationComponent;
  let fixture: ComponentFixture<TeamPresentationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamPresentationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
