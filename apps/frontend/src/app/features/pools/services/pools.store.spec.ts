import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, Subject, throwError } from 'rxjs';

import { PoolsStore } from './pools.store';
import { PoolsApiService } from './pools-api.service';
import { QuestionPool } from '@pools/models/question-pool.model';

interface PoolsApiItem {
  id: number | string;
  code: string;
  name: string;
  description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface PoolsApiServiceMock {
  list: jasmine.Spy<() => Observable<QuestionPool[]>>;
  get: jasmine.Spy<(id: string) => Observable<QuestionPool>>;
  create: jasmine.Spy<(dto: { code: string; name: string; description?: string }) => Observable<QuestionPool>>;
  update: jasmine.Spy<(id: string, dto: { name?: string; code?: string; description?: string }) => Observable<QuestionPool>>;
}

const httpErr = (status: number, errorBody: unknown = {}): HttpErrorResponse =>
  new HttpErrorResponse({
    status,
    statusText: 'ERR',
    url: '/api/questionpools/',
    error: errorBody,
  });

describe('PoolsStore', () => {
  let store: PoolsStore;
  let apiMock: PoolsApiServiceMock;

  beforeEach(() => {
    apiMock = {
      list: jasmine.createSpy('list'),
      get: jasmine.createSpy('get'),
      create: jasmine.createSpy('create'),
      update: jasmine.createSpy('update'),
    };

    TestBed.configureTestingModule({
      providers: [
        PoolsStore,
        { provide: PoolsApiService, useValue: apiMock },
      ],
    });

    store = TestBed.inject(PoolsStore);
  });

  it('loadAll() should set loading true then false and map items into pools()', () => {
    const apiItems: PoolsApiItem[] = [
      {
        id: 1,
        code: 'pool-1',
        name: 'Pool 1',
        description: '  desc  ',
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: null,
      },
      {
        id: '2',
        code: 'pool-2',
        name: 'Pool 2',
        description: null,
        updated_at: '2026-03-02T00:00:00.000Z',
      },
    ];

    const subject = new Subject<QuestionPool[]>();
    apiMock.list.and.returnValue(subject.asObservable());

    expect(store.isLoading()).toBeFalse();

    store.loadAll();

    expect(store.isLoading()).toBeTrue();
    expect(store.error()).toBeNull();

    subject.next(apiItems as unknown as QuestionPool[]);
    subject.complete();

    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBeNull();

    const pools = store.pools();
    expect(pools.length).toBe(2);

    expect(pools[0]).toEqual({
      id: '1',
      code: 'pool-1',
      name: 'Pool 1',
      description: 'desc',
      updatedAt: '2026-03-01T00:00:00.000Z', // created_at used because updated_at null
    });

    expect(pools[1]).toEqual({
      id: '2',
      code: 'pool-2',
      name: 'Pool 2',
      description: '',
      updatedAt: '2026-03-02T00:00:00.000Z',
    });
  });

  it('loadAll() should set a friendly error message on network error (status 0)', () => {
    apiMock.list.and.returnValue(throwError(() => httpErr(0)));

    store.loadAll();

    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBe('Network error (API unreachable).');
  });

  it('loadAll() should pick detail from payload.detail if present', () => {
    apiMock.list.and.returnValue(throwError(() => httpErr(400, { detail: 'Bad request.' })));

    store.loadAll();

    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBe('Bad request.');
  });

  it('loadOne() should set selectedPool and sync list cache (insert when missing)', () => {
    apiMock.list.and.returnValue(of([] as QuestionPool[]));
    store.loadAll();

    const apiItem: PoolsApiItem = {
      id: 'p42',
      code: 'pool-42',
      name: 'Pool 42',
      description: 'x',
      updated_at: '2026-03-03T00:00:00.000Z',
    };

    apiMock.get.and.returnValue(of(apiItem as unknown as QuestionPool));

    store.loadOne('p42');

    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBeNull();

    expect(store.selectedPool()).toEqual({
      id: 'p42',
      code: 'pool-42',
      name: 'Pool 42',
      description: 'x',
      updatedAt: '2026-03-03T00:00:00.000Z',
    });

    const pools = store.pools();
    expect(pools.length).toBe(1);
    expect(pools[0].id).toBe('p42');
  });

  it('loadOne() should sync list cache (update existing when present)', () => {
    const initial: QuestionPool[] = [
      { id: 'p42', code: 'old', name: 'Old', description: '', updatedAt: '2026-03-01T00:00:00.000Z' } as QuestionPool,
    ];
    apiMock.list.and.returnValue(of(initial));
    store.loadAll();

    const updated: PoolsApiItem = {
      id: 'p42',
      code: 'new',
      name: 'New',
      description: '  newdesc  ',
      updated_at: '2026-03-04T00:00:00.000Z',
    };
    apiMock.get.and.returnValue(of(updated as unknown as QuestionPool));

    store.loadOne('p42');

    const pools = store.pools();
    expect(pools.length).toBe(1);
    expect(pools[0]).toEqual({
      id: 'p42',
      code: 'new',
      name: 'New',
      description: 'newdesc',
      updatedAt: '2026-03-04T00:00:00.000Z',
    });
  });

  it('create() should call api.create then loadAll and call onSuccess', () => {
    apiMock.create.and.returnValue(of({} as QuestionPool));
    apiMock.list.and.returnValue(of([] as QuestionPool[]));

    const loadAllSpy = spyOn(store, 'loadAll').and.callThrough();
    const onSuccess = jasmine.createSpy('onSuccess');

    store.create({ code: 'c', name: 'n', description: 'd' }, onSuccess);

    expect(apiMock.create).toHaveBeenCalledTimes(1);
    expect(loadAllSpy).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('create() should set error when api.create fails and should not call onSuccess', () => {
    apiMock.create.and.returnValue(throwError(() => httpErr(401)));
    const onSuccess = jasmine.createSpy('onSuccess');

    store.create({ code: 'c', name: 'n' }, onSuccess);

    expect(store.isLoading()).toBeFalse();
    expect(store.error()).toBe('Unauthorized. Please login again.');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('update() should set selectedPool and sync list cache then call onSuccess', () => {
    const initial: QuestionPool[] = [
      { id: 'p1', code: 'c1', name: 'N1', description: '', updatedAt: '2026-03-01T00:00:00.000Z' } as QuestionPool,
    ];
    apiMock.list.and.returnValue(of(initial));
    store.loadAll();

    const apiItem: PoolsApiItem = {
      id: 'p1',
      code: 'c2',
      name: 'N2',
      description: '  d  ',
      updated_at: '2026-03-04T00:00:00.000Z',
    };

    apiMock.update.and.returnValue(of(apiItem as unknown as QuestionPool));

    const onSuccess = jasmine.createSpy('onSuccess');

    store.update('p1', { name: 'N2' }, onSuccess);

    expect(store.selectedPool()).toEqual({
      id: 'p1',
      code: 'c2',
      name: 'N2',
      description: 'd',
      updatedAt: '2026-03-04T00:00:00.000Z',
    });

    const pools = store.pools();
    expect(pools.length).toBe(1);
    expect(pools[0].name).toBe('N2');

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('clearSelected() should reset selectedPool to null', () => {
    apiMock.get.and.returnValue(of({
      id: 'p1',
      code: 'c',
      name: 'n',
      updated_at: '2026-03-04T00:00:00.000Z',
    } as unknown as QuestionPool));

    store.loadOne('p1');
    expect(store.selectedPool()).not.toBeNull();

    store.clearSelected();
    expect(store.selectedPool()).toBeNull();
  });
});
