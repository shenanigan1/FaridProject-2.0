import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { JobOffer } from '@jobs/models/job-offer.model';

import { JobOfferDetailCardComponent } from './job-offer-detail-card.component';

describe('JobOfferDetailCardComponent', () => {
  let fixture: ComponentFixture<JobOfferDetailCardComponent>;
  let component: JobOfferDetailCardComponent;

  const mockOffer: JobOffer = {
    id: 1,
    title: 'Backend Developer',
    location: 'Paris',
    contractType: 'CDI',
    description: 'Detailed job description',
    department: 'Engineering',
    salary: 50000,
    createdAt: '2026-03-19T10:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobOfferDetailCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JobOfferDetailCardComponent);
    component = fixture.componentInstance;
    component.offer = mockOffer;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the job title', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Backend Developer');
  });

  it('should render the job metadata', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Paris');
    expect(compiled.textContent).toContain('CDI');
    expect(compiled.textContent).toContain('Engineering');
    expect(compiled.textContent).toContain('50000');
    expect(compiled.textContent).toContain('Detailed job description');
    expect(compiled.textContent).toContain('2026-03-19T10:00:00Z');
  });

  it('should emit applyClicked when the apply button is clicked', () => {
    spyOn(component.applyClicked, 'emit');

    const button = fixture.debugElement.query(
      By.css('[data-testid="apply-button"] button'),
    ).nativeElement as HTMLButtonElement;

    button.click();

    expect(component.applyClicked.emit).toHaveBeenCalledTimes(1);
  });
});
