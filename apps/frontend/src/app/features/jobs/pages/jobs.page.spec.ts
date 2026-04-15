import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { JobsPage } from './jobs.page';

describe('JobsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobsPage],
    }).compileComponents();
  });

  it('renders the jobs operations page heading and description', () => {
    const fixture = TestBed.createComponent(JobsPage);
    fixture.detectChanges();

    const title = fixture.debugElement.query(By.css('h1'))?.nativeElement as HTMLElement;
    const description = fixture.debugElement.query(By.css('[data-testid="jobs-page-subtitle"]'))
      ?.nativeElement as HTMLElement;

    expect(title.textContent?.trim()).toBe('Jobs');
    expect(description.textContent).toContain('Manage openings, monitor applications, and launch evaluations.');
  });

  it('shows shortcut links for recruitment operations', () => {
    const fixture = TestBed.createComponent(JobsPage);
    fixture.detectChanges();

    const links = fixture.debugElement.queryAll(By.css('[data-testid="jobs-shortcut"]'));
    const linkTexts = links.map((link) => (link.nativeElement as HTMLElement).textContent?.trim());

    expect(linkTexts).toEqual([
      'Openings board',
      'Applicants workflow',
      'Tests in progress',
    ]);
  });
});
