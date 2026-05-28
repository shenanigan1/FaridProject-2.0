import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiProgressBarComponent } from './progress-bar.component';

describe('UiProgressBarComponent', () => {
  let fixture: ComponentFixture<UiProgressBarComponent>;
  let component: UiProgressBarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiProgressBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiProgressBarComponent);
    component = fixture.componentInstance;
  });

  it('renders an accessible determinate progressbar', () => {
    component.value = 42;
    fixture.detectChanges();

    const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLDivElement;

    expect(progress.getAttribute('aria-valuemin')).toBe('0');
    expect(progress.getAttribute('aria-valuemax')).toBe('100');
    expect(progress.getAttribute('aria-valuenow')).toBe('42');
  });

  it('clamps values to the 0-100 range', () => {
    component.value = 150;

    expect(component.clamped).toBe(100);
  });
});

