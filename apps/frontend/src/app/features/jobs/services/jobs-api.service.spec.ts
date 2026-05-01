import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PositionDto } from '@features/positions/services/positions-api.service';
import { JobsApiService, getJobStatus, matchesJobSearch } from './jobs-api.service';

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

describe('JobsApiService', () => {
  let service: JobsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [JobsApiService],
    });

    service = TestBed.inject(JobsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads positions, application counts and companies from authenticated API routes', () => {
    let received: unknown;
    const position = makePosition({ id: 7 });
    const company = { id: 1, name: 'TransLog', created_at: '' };

    service.loadWorkspace().subscribe((workspace) => (received = workspace));

    httpMock.expectOne('/api/positions/').flush({ results: [position] });
    httpMock.expectOne('/api/jobapplications/').flush([
      { position: 7 },
      { position: 7 },
      { position: 8 },
    ]);
    httpMock.expectOne('/api/companies/').flush([company]);

    expect(received).toEqual({
      positions: [position],
      applicationCounts: { 7: 2, 8: 1 },
      companies: [company],
    });
  });

  it('creates, updates and archives positions through the backend', () => {
    service.createPosition({
      company: 1,
      title: 'Driver',
      department: 'Operations',
      contract_type: 'Full-time',
      is_active: true,
    }).subscribe();

    const createReq = httpMock.expectOne('/api/positions/');
    expect(createReq.request.method).toBe('POST');
    createReq.flush(makePosition({ title: 'Driver' }));

    service.updatePosition(3, { title: 'Updated driver' }).subscribe();
    const updateReq = httpMock.expectOne('/api/positions/3/');
    expect(updateReq.request.method).toBe('PATCH');
    expect(updateReq.request.body).toEqual({ title: 'Updated driver' });
    updateReq.flush(makePosition({ id: 3, title: 'Updated driver' }));

    service.archivePosition(3).subscribe();
    const archiveReq = httpMock.expectOne('/api/positions/3/');
    expect(archiveReq.request.method).toBe('PATCH');
    expect(archiveReq.request.body).toEqual({ is_active: false });
    archiveReq.flush(makePosition({ id: 3, is_active: false }));
  });
});

describe('jobs search helpers', () => {
  it('filters by query, location, truck type and priority', () => {
    const position = makePosition();

    expect(
      matchesJobSearch(position, {
        query: 'cdl',
        location: 'phoenix',
        contractType: 'full-time',
        status: 'active',
      }),
    ).toBeTrue();

    expect(
      matchesJobSearch(position, {
        query: 'reefer',
        location: 'all',
        contractType: 'all',
        status: 'all',
      }),
    ).toBeFalse();
  });

  it('marks inactive jobs as drafts', () => {
    expect(getJobStatus(makePosition({ is_active: false }))).toBe('draft');
  });
});
