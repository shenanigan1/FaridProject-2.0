import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';

import { JobCardComponent } from './job-card.component';
import { JobOffer } from '../../models/job-offer.model';

describe('JobCardComponent', () => {
  let fixture: ComponentFixture<JobCardComponent>;
  let component: JobCardComponent;

  const mockJob: JobOffer = {
    id: 4,
    title: 'Freelance search agent',
    location: 'Chicago',
    contractType: 'Freelance',
    description: 'You will manage the container center',
    department: 'Container Management',
    salary: 100000,
    createdAt: '2026-02-23T08:39:37.826088-06:00',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(JobCardComponent);
    component = fixture.componentInstance;
    component.job = mockJob;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the title', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Freelance search agent');
  });

  it('should render location, contract type and department', () => {
    const location = fixture.nativeElement.querySelector('[data-testid="job-location"]');
    expect(location.textContent).toContain('Chicago');

    const contractType = fixture.nativeElement.querySelector('[data-testid="job-contractType"]');
    expect(contractType.textContent).toContain('Freelance');

    const department = fixture.nativeElement.querySelector('[data-testid="job-department"]');
    expect(department.textContent).toContain('Container Management');
  });

  it('should render the description', () => {
    const description = fixture.nativeElement.querySelector('[data-testid="job-description"]');
    expect(description.textContent).toContain('You will manage the container center');
  });

  it('should render a details link with the job id', async () => {
    const anchor: HTMLAnchorElement = fixture.nativeElement.querySelector('a');

    expect(anchor).toBeTruthy();
    expect(anchor.textContent?.trim()).toBe('View details');

    await fixture.whenStable();
    fixture.detectChanges();

    expect(anchor.getAttribute('href') ?? '').toContain('/jobs/4');
  });
});
