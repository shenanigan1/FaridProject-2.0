import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';

import { JobPublicApiService } from './job-public-api.service';
// import { JobOffer } from '../models/job-offer.model';

describe('JobPublicApiService', () => {
  let service: JobPublicApiService;
  let httpMock: HttpTestingController;

  const expectedUrl = 'http://localhost:8000/api/public/positions';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JobPublicApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(JobPublicApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call the public positions endpoint', () => {
    service.getJobOffers({}).subscribe();

    const request = httpMock.expectOne(expectedUrl);

    expect(request.request.method).toBe('GET');

    request.flush([]);
  });

  it('should pass supported query params', () => {
    service
      .getJobOffers({
        search: 'driver',
        location: 'Chicago',
        page: 1,
      })
      .subscribe();

    const request = httpMock.expectOne((req) => {
      return (
        req.url === expectedUrl &&
        req.params.get('search') === 'driver' &&
        req.params.get('location') === 'Chicago'
      );
    });

    expect(request.request.method).toBe('GET');

    request.flush([]);
  });

  it('should map DTO array to paginated frontend response', () => {
    let actualResponse:
      | {
          count: number;
          next: string | null;
          previous: string | null;
          results: unknown[];
        }
      | undefined;

    service.getJobOffers({}).subscribe((response) => {
      actualResponse = response;
    });

    const request = httpMock.expectOne(expectedUrl);

    request.flush([
      {
        id: 4,
        title: 'Freelance search agent',
        location: 'Chicago',
        contract_type: 'Freelance',
        description: 'You will manage the container center',
        department: 'Container Management',
        salary: 100000,
        created_at: '2026-02-23T08:39:37.826088-06:00',
      },
    ]);

    expect(actualResponse).toEqual({
      count: 1,
      next: null,
      previous: null,
      results: [
        {
          id: 4,
          title: 'Freelance search agent',
          location: 'Chicago',
          contractType: 'Freelance',
          description: 'You will manage the container center',
          department: 'Container Management',
          salary: 100000,
          createdAt: '2026-02-23T08:39:37.826088-06:00',
        },
      ],
    });
  });

  it('should fetch a job offer by id', () => {
    const mockDto = {
      id: 1,
      title: 'Frontend Developer',
      location: 'Lyon',
      contract_type: 'CDI',
      description: 'Detailed job description',
      created_at: '2026-03-19T10:00:00Z',
      salary: 150000,
      department: 'Informatique',
    };

    const expectedModel = {
      id: 1,
      title: 'Frontend Developer',
      location: 'Lyon',
      contractType: 'CDI',
      description: 'Detailed job description',
      createdAt: '2026-03-19T10:00:00Z',
      salary: 150000,
      department: 'Informatique',
    };

    service.getOfferById(1).subscribe((offer) => {
      expect(offer).toEqual(expectedModel);
    });

    const request = httpMock.expectOne(`${expectedUrl}/1/`);
    expect(request.request.method).toBe('GET');
    request.flush(mockDto);
  });

  it('should propagate a 404 error', () => {
  let actualError: HttpErrorResponse | null = null;

  service.getOfferById(999).subscribe({
    next: () => fail('Expected error'),
    error: (error: HttpErrorResponse) => {
      actualError = error;
    },
  });

  const request = httpMock.expectOne(`${expectedUrl}/999/`);

  request.flush(
    { detail: 'Not found' },
    { status: 404, statusText: 'Not Found' }
  );

  expect(actualError).not.toBeNull();
  expect(actualError!.status).toBe(404);
});

  it('should return an empty paginated response when backend returns an empty array', () => {
    let actualResponse:
      | {
          count: number;
          next: string | null;
          previous: string | null;
          results: unknown[];
        }
      | undefined;

    service.getJobOffers({}).subscribe((response) => {
      actualResponse = response;
    });

    const request = httpMock.expectOne(expectedUrl);

    request.flush([]);

    expect(actualResponse).toEqual({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
  });
});
