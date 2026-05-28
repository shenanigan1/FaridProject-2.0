import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiCardComponent } from './card.component';

describe('UiCardComponent', () => {
  let fixture: ComponentFixture<UiCardComponent>;
  let component: UiCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiCardComponent);
    component = fixture.componentInstance;
  });

  it('uses shared card classes by default', () => {
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('div') as HTMLDivElement;

    expect(card.className).toContain('ff-card');
  });

  it('applies data card and semantic accent variants', () => {
    component.variant = 'data';
    component.tone = 'success';
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('div') as HTMLDivElement;

    expect(card.className).toContain('ff-data-card');
    expect(card.className).toContain('ff-accent-marker');
    expect(card.className).toContain('ff-accent-success');
  });
});

