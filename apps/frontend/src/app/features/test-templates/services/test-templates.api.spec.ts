import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TemplatesApi } from '@features/test-templates/services/test-templates.api';

describe('TemplatesApi', () => {
  let api: TemplatesApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TemplatesApi],
    });

    api = TestBed.inject(TemplatesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('list() should call GET /api/templates/ with no params by default', () => {
    api.list().subscribe();

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/templates/');
    expect(req.request.params.keys().length).toBe(0);

    req.flush([]);
  });

  it('list() should send search param', () => {
    api.list({ search: 'abc' }).subscribe();

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/templates/');
    expect(req.request.params.get('search')).toBe('abc');

    req.flush([]);
  });

  it('list() should send difficulty param', () => {
    api.list({ difficulty: 'hard' }).subscribe();

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/templates/');
    expect(req.request.params.get('difficulty')).toBe('hard');

    req.flush([]);
  });

  it('list() should send is_active param when provided (true)', () => {
    api.list({ isActive: true }).subscribe();

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/templates/');
    expect(req.request.params.get('is_active')).toBe('true');

    req.flush([]);
  });

  it('list() should send is_active param when provided (false)', () => {
    api.list({ isActive: false }).subscribe();

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/templates/');
    expect(req.request.params.get('is_active')).toBe('false');

    req.flush([]);
  });

  it('get() should call GET /api/templates/:id/', () => {
    api.get(12).subscribe();

    const req = httpMock.expectOne('/api/templates/12/');
    expect(req.request.method).toBe('GET');

    req.flush({});
  });

  it('create() should call POST /api/templates/', () => {
    api.create({} as never).subscribe();

    const req = httpMock.expectOne('/api/templates/');
    expect(req.request.method).toBe('POST');

    req.flush({});
  });

  it('update() should call PATCH /api/templates/:id/', () => {
    api.update(12, {} as never).subscribe();

    const req = httpMock.expectOne('/api/templates/12/');
    expect(req.request.method).toBe('PATCH');

    req.flush({});
  });
});
