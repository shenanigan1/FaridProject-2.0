import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { PoolsApiService, CreatePoolDto, UpdatePoolDto } from './pools-api.service';
import { QuestionPool } from '@pools/models/question-pool.model';

describe('PoolsApiService', () => {
  let service: PoolsApiService;
  let httpMock: HttpTestingController;

  const baseUrl = '/api/questionpools/';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PoolsApiService],
    });

    service = TestBed.inject(PoolsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('list() should GET /api/questionpools/', () => {
    const mockResponse: QuestionPool[] = [
      { id: 'p1', name: 'Pool 1', code: 'pool-1', description: 'desc' } as QuestionPool,
      { id: 'p2', name: 'Pool 2', code: 'pool-2', description: 'desc' } as QuestionPool,
    ];

    let received: QuestionPool[] | undefined;

    service.list().subscribe((res) => (received = res));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);

    expect(received).toEqual(mockResponse);
  });

  it('get(id) should GET /api/questionpools/:id/', () => {
    const id = 'p42';
    const mockResponse: QuestionPool =
      { id, name: 'Pool 42', code: 'pool-42', description: 'desc' } as QuestionPool;

    let received: QuestionPool | undefined;

    service.get(id).subscribe((res) => (received = res));

    const req = httpMock.expectOne(`${baseUrl}${id}/`);
    expect(req.request.method).toBe('GET');

    req.flush(mockResponse);

    expect(received).toEqual(mockResponse);
  });

  it('create(dto) should POST /api/questionpools/ with body', () => {
    const dto: CreatePoolDto = {
      name: 'My Pool',
      code: 'my-pool',
      description: 'desc',
    };

    const mockResponse: QuestionPool =
      { id: 'created', ...dto } as QuestionPool;

    let received: QuestionPool | undefined;

    service.create(dto).subscribe((res) => (received = res));

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);

    req.flush(mockResponse);

    expect(received).toEqual(mockResponse);
  });

  it('update(id, dto) should PATCH /api/questionpools/:id/ with body', () => {
    const id = 'p42';
    const dto: UpdatePoolDto = {
      name: 'Updated name',
    };

    const mockResponse: QuestionPool =
      { id, name: 'Updated name', code: 'pool-42', description: 'desc' } as QuestionPool;

    let received: QuestionPool | undefined;

    service.update(id, dto).subscribe((res) => (received = res));

    const req = httpMock.expectOne(`${baseUrl}${id}/`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(dto);

    req.flush(mockResponse);

    expect(received).toEqual(mockResponse);
  });

  it('delete(id) should DELETE /api/questionpools/:id/', () => {
    const id = 'p42';
    let completed = false;

    service.delete(id).subscribe({
      next: () => void 0,
      complete: () => (completed = true),
    });

    const req = httpMock.expectOne(`${baseUrl}${id}/`);
    expect(req.request.method).toBe('DELETE');

    req.flush(null);

    expect(completed).toBeTrue();
  });
});
