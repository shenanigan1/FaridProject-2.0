import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { JobListPageComponent } from './job-list.page';
import { JobPublicApiService } from '@jobs/services/job-public-api.service';
import { JobOffer } from '@jobs/models/job-offer.model';

describe('JobListPageComponent', () => {
  let fixture: ComponentFixture<JobListPageComponent>;
  let component: JobListPageComponent;
  let jobPublicApiServiceSpy: jasmine.SpyObj<JobPublicApiService>;
  let router: Router;
  let activatedRoute: ActivatedRoute;

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
    jobPublicApiServiceSpy = jasmine.createSpyObj<JobPublicApiService>(
      'JobPublicApiService',
      ['getJobOffers'],
    );

    await TestBed.configureTestingModule({
      imports: [JobListPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(
              convertToParamMap({
                search: '',
                location: '',
                employmentType: '',
                priority: '',
                page: '1',
              }),
            ),
          },
        },
        { provide: JobPublicApiService, useValue: jobPublicApiServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(JobListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', () => {
    jobPublicApiServiceSpy.getJobOffers.and.returnValue(
      of({
        count: 1,
        next: null,
        previous: null,
        results: [mockJob],
      }),
    );

    createComponent();

    expect(component).toBeTruthy();
  });

  it('should call the service on init with normalized filters', () => {
    jobPublicApiServiceSpy.getJobOffers.and.returnValue(
      of({
        count: 1,
        next: null,
        previous: null,
        results: [mockJob],
      }),
    );

    createComponent();

    expect(jobPublicApiServiceSpy.getJobOffers).toHaveBeenCalledWith({
      search: '',
      location: '',
      employmentType: '',
      priority: '',
      page: 1,
    });
  });

  it('should render loaded state when jobs are returned', fakeAsync(() => {
    jobPublicApiServiceSpy.getJobOffers.and.returnValue(
      of({
        count: 1,
        next: null,
        previous: null,
        results: [mockJob],
      }),
    );

    createComponent();
    tick();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.querySelector('.ff-workflow-hero')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.ff-card-grid')).not.toBeNull();
    expect(content).toContain('1 offre trouvee');
    expect(content).toContain('Freelance search agent');
  }));

  it('should render empty state when no jobs are returned', fakeAsync(() => {
    jobPublicApiServiceSpy.getJobOffers.and.returnValue(
      of({
        count: 0,
        next: null,
        previous: null,
        results: [],
      }),
    );

    createComponent();
    tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aucune offre trouvee');
  }));

  it('should render error state when the service fails', fakeAsync(() => {
    jobPublicApiServiceSpy.getJobOffers.and.returnValue(
      throwError(() => new Error('Boom')),
    );

    createComponent();
    tick();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'An error occurred while loading job offers.',
    );
  }));

  it('should navigate with new query params on filters change', () => {
    jobPublicApiServiceSpy.getJobOffers.and.returnValue(
      of({
        count: 1,
        next: null,
        previous: null,
        results: [mockJob],
      }),
    );

    createComponent();

    component.onFiltersChange({
      search: 'driver',
      location: 'Chicago',
      employmentType: 'full-time',
      priority: 'high',
    });

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: activatedRoute,
      queryParams: {
        search: 'driver',
        location: 'Chicago',
        employmentType: 'full-time',
        priority: 'high',
        page: 1,
      },
      queryParamsHandling: '',
    });
  });

  it('should clear query params on reset', () => {
    jobPublicApiServiceSpy.getJobOffers.and.returnValue(
      of({
        count: 1,
        next: null,
        previous: null,
        results: [mockJob],
      }),
    );

    createComponent();

    component.onResetFilters();

    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: activatedRoute,
      queryParams: {},
    });
  });

  it('should track jobs by id', () => {
    jobPublicApiServiceSpy.getJobOffers.and.returnValue(
      of({
        count: 1,
        next: null,
        previous: null,
        results: [mockJob],
      }),
    );

    createComponent();

    expect(component.trackByJobId(0, mockJob)).toBe(4);
  });
});
