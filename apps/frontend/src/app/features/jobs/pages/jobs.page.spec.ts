import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { firstValueFrom, of, take } from 'rxjs';

import { PositionDto } from '@features/positions/services/positions-api.service';
import { JobsApiService, JobsWorkspace } from '@features/jobs/services/jobs-api.service';
import { JobsPage } from './jobs.page';

function makePosition(overrides: Partial<PositionDto> = {}): PositionDto {
  const now = new Date().toISOString();

  return {
    id: 1,
    company: 1,
    title: 'Senior CDL-A Driver',
    description: 'Urgent flatbed route',
    department: 'Operations',
    contract_type: 'Full-time',
    location: 'Phoenix, AZ',
    salary: null,
    is_active: true,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function makeWorkspace(overrides: Partial<JobsWorkspace> = {}): JobsWorkspace {
  return {
    positions: [
      makePosition(),
      makePosition({
        id: 2,
        title: 'Local Delivery Driver',
        description: 'Reefer route',
        location: 'Dallas, TX',
      }),
    ],
    applicationCounts: { 1: 12, 2: 4 },
    companies: [{ id: 1, name: 'TransLog', created_at: '' }],
    ...overrides,
  };
}

describe('JobsPage', () => {
  let api: jasmine.SpyObj<JobsApiService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<JobsApiService>('JobsApiService', [
      'loadWorkspace',
      'createPosition',
      'updatePosition',
      'archivePosition',
    ]);
    api.loadWorkspace.and.returnValue(of(makeWorkspace()));
    api.createPosition.and.callFake((payload) =>
      of(makePosition({ id: 9, title: payload.title, company: payload.company })),
    );
    api.updatePosition.and.callFake((id, payload) =>
      of(makePosition({ id, title: payload.title ?? 'Updated job' })),
    );
    api.archivePosition.and.callFake((id) => of(makePosition({ id, is_active: false })));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [JobsPage],
      providers: [
        { provide: JobsApiService, useValue: api },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  it('renders Figma job-search controls backed by reactive filters', () => {
    const fixture = TestBed.createComponent(JobsPage);
    fixture.detectChanges();

    const shell = fixture.debugElement.query(By.css('.ff-workflow-hero'));
    const toolbar = fixture.debugElement.query(By.css('.ff-toolbar-panel'));
    const stats = fixture.debugElement.queryAll(By.css('.ff-stat-mini'));
    const search = fixture.debugElement.query(By.css('input[type="search"]'))
      .nativeElement as HTMLInputElement;
    const filters = fixture.debugElement.queryAll(By.css('.ff-jobs-filter'));

    expect(shell).withContext('jobs page should use the shared UI Book hero').not.toBeNull();
    expect(toolbar).withContext('jobs filters should live in the shared toolbar panel').not.toBeNull();
    expect(stats.length).withContext('jobs page should expose compact KPI stats').toBeGreaterThanOrEqual(3);
    expect(search.getAttribute('aria-label')).toBe('Search job offers');
    expect(search.getAttribute('placeholder')).toBe('Rechercher une offre, une ville, une equipe...');
    expect(filters.length).toBe(3);
    expect(api.loadWorkspace).toHaveBeenCalledTimes(1);
  });

  it('renders job cards from the backend workspace', () => {
    const fixture = TestBed.createComponent(JobsPage);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Senior CDL-A Driver');
    expect(text).toContain('Local Delivery Driver');
    expect(text).toContain('12 candidatures');
    expect(fixture.debugElement.queryAll(By.css('.ff-card-grid .ff-data-card')).length).toBe(2);
  });

  it('filters jobs by search text', () => {
    const fixture = TestBed.createComponent(JobsPage);
    fixture.detectChanges();

    fixture.componentInstance.searchCtrl.setValue('local');
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Senior CDL-A Driver');
    expect(text).toContain('Local Delivery Driver');
  });

  it('creates a job offer through the secure jobs API facade', () => {
    const fixture = TestBed.createComponent(JobsPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.openCreate();
    component.editorForm.patchValue({
      company: 1,
      title: 'OTR Long Haul Specialist',
      department: 'Dry Van',
      contract_type: 'Full-time',
      location: 'National',
      description: '21 days out',
      is_active: true,
    });
    component.saveJob();

    expect(api.createPosition).toHaveBeenCalledWith(
      jasmine.objectContaining({
        company: 1,
        title: 'OTR Long Haul Specialist',
        department: 'Dry Van',
      }),
    );
  });

  it('updates and archives an existing job offer', async () => {
    const fixture = TestBed.createComponent(JobsPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const offers = await firstValueFrom(component.jobOffers$.pipe(take(1)));

    component.openEdit(offers[0]);
    component.editorForm.patchValue({ title: 'Updated CDL-A Driver' });
    component.saveJob();

    expect(api.updatePosition).toHaveBeenCalledWith(
      1,
      jasmine.objectContaining({ title: 'Updated CDL-A Driver' }),
    );

    component.archiveJob(offers[0]);
    expect(api.archivePosition).toHaveBeenCalledWith(1);
  });

  it('opens applicants list from the three-dot job action', () => {
    const fixture = TestBed.createComponent(JobsPage);
    fixture.detectChanges();

    const moreButton = fixture.debugElement.query(By.css('.ff-job-card__more'))
      .nativeElement as HTMLButtonElement;
    moreButton.click();

    expect(router.navigate).toHaveBeenCalledOnceWith(['/positions', 1, 'applicants']);
    expect(api.archivePosition).not.toHaveBeenCalled();
  });
});
