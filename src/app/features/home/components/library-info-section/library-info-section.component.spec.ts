import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibraryInfoSectionComponent } from './library-info-section.component';

describe('LibraryInfoSectionComponent', () => {
  let component: LibraryInfoSectionComponent;
  let fixture: ComponentFixture<LibraryInfoSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibraryInfoSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibraryInfoSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
