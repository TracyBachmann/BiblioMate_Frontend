import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CataloguePreviewComponent } from './catalogue-preview.component';

describe('CataloguePreviewComponent', () => {
  let component: CataloguePreviewComponent;
  let fixture: ComponentFixture<CataloguePreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CataloguePreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CataloguePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
