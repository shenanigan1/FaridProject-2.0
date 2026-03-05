import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { TemplatesApi } from '@features/test-templates/services/test-templates.api';
import type { TemplateListItem } from '@features/test-templates/models/test-templates.model';

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

  it('list() should call GET /api/templates/ with no params when query is empty', () => {
    const expected: TemplateListItem[] = [];

    api.list({}).subscribe((res) => {
      expect(res).toEqual(expected);
    });

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/templates/');
    expect(req.request.params.keys().length).toBe(0);

    req.flush(expected);
  });

  it('list() should send search + difficulty + is_active params when provided', () => {
    const expected: TemplateListItem[] = [];

    api
      .list({
        search: 'hello',
        difficulty: 'hard',
        isActive: true,
      })
      .subscribe((res) => {
        expect(res).toEqual(expected);
      });

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/templates/');
    expect(req.request.params.get('search')).toBe('hello');
    expect(req.request.params.get('difficulty')).toBe('hard');
    expect(req.request.params.get('is_active')).toBe('true');

    req.flush(expected);
  });

  it('list() should not include is_active when isActive is undefined', () => {
    api.list({ isActive: undefined }).subscribe();

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url === '/api/templates/');
    expect(req.request.params.has('is_active')).toBe(false);

    req.flush([]);
  });
});
