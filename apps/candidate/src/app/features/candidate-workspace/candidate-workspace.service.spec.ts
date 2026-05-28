import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { JobPublicApiService } from '@jobs/services/job-public-api.service';
import { CandidateWorkspaceService } from './candidate-workspace.service';

describe('CandidateWorkspaceService', () => {
  let service: CandidateWorkspaceService;
  let httpMock: HttpTestingController;
  let jobApiSpy: jasmine.SpyObj<JobPublicApiService>;

  beforeEach(() => {
    jobApiSpy = jasmine.createSpyObj<JobPublicApiService>('JobPublicApiService', ['getOfferById']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: JobPublicApiService, useValue: jobApiSpy },
      ],
    });

    service = TestBed.inject(CandidateWorkspaceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads candidate applications from the authenticated API and enriches titles from public jobs', () => {
    jobApiSpy.getOfferById.and.returnValue(
      of({
        id: 4,
        title: 'Chauffeur SPL',
        location: 'Lyon',
        contractType: 'CDI',
        description: '',
        department: '',
        salary: 3200,
        createdAt: '2026-05-01T00:00:00Z',
      }),
    );

    let result: unknown;
    service.listApplications().subscribe((items) => (result = items));

    const request = httpMock.expectOne('http://localhost:8000/api/jobapplications/');
    request.flush({
      results: [
        {
          id: 9,
          candidate: 2,
          position: 4,
          status: 'applied',
          created_at: '2026-05-10T00:00:00Z',
          updated_at: '2026-05-11T00:00:00Z',
        },
      ],
    });

    expect(jobApiSpy.getOfferById).toHaveBeenCalledOnceWith(4);
    expect(result).toEqual([
      {
        id: 9,
        positionId: 4,
        title: 'Chauffeur SPL',
        location: 'Lyon',
        status: 'applied',
        createdAt: '2026-05-10T00:00:00Z',
        updatedAt: '2026-05-11T00:00:00Z',
      },
    ]);
  });

  it('keeps a real position id fallback when the public job is unavailable', () => {
    jobApiSpy.getOfferById.and.returnValue(throwError(() => new Error('not public')));

    let title = '';
    service.listApplications().subscribe((items) => {
      title = items[0]?.title ?? '';
    });

    const request = httpMock.expectOne('http://localhost:8000/api/jobapplications/');
    request.flush([
      {
        id: 10,
        candidate: 2,
        position: 42,
        status: 'applied',
        created_at: '2026-05-10T00:00:00Z',
        updated_at: '2026-05-11T00:00:00Z',
      },
    ]);

    expect(title).toBe('Poste #42');
  });

  it('loads candidate tests from the evaluations endpoint', () => {
    let result: unknown;
    service.listTests().subscribe((items) => (result = items));

    const request = httpMock.expectOne('http://localhost:8000/api/evaluations/');
    request.flush([
      {
        id: 12,
        application: 9,
        position: 4,
        status: 'completed',
        template_name: 'Sécurité Hazmat',
        position_title: 'Chauffeur SPL',
        created_at: '2026-05-10T00:00:00Z',
        updated_at: '2026-05-11T00:00:00Z',
        completed_at: '2026-05-12T00:00:00Z',
        validated_at: null,
      },
    ]);

    expect(result).toEqual([
      {
        id: 12,
        applicationId: 9,
        positionId: 4,
        title: 'Sécurité Hazmat',
        positionTitle: 'Chauffeur SPL',
        status: 'completed',
        createdAt: '2026-05-10T00:00:00Z',
        updatedAt: '2026-05-11T00:00:00Z',
        completedAt: '2026-05-12T00:00:00Z',
        validatedAt: null,
      },
    ]);
  });
});
