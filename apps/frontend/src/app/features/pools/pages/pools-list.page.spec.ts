import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Signal, WritableSignal, signal } from '@angular/core';

import { PoolsListPageComponent } from './pools-list.page';
import { PoolsStore } from '@features/pools/services/pools.store';
import { QuestionPool } from '@features/pools/models/question-pool.model';

interface PoolsStoreMock {
  pools: WritableSignal<QuestionPool[]>;
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  loadAll: jasmine.Spy<() => void>;
}

describe('PoolsListPageComponent', () => {
  const makeStoreMock = (initialPools: QuestionPool[] = []): PoolsStoreMock => ({
    pools: signal<QuestionPool[]>(initialPools),
    isLoading: signal(false),
    error: signal<string | null>(null),
    loadAll: jasmine.createSpy<() => void>('loadAll'),
  });

  const setup = (storeMock: PoolsStoreMock): {
    fixture: ComponentFixture<PoolsListPageComponent>;
    component: PoolsListPageComponent;
    routerSpy: jasmine.SpyObj<Router>;
    store: PoolsStoreMock;
  } => {
    const routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [PoolsListPageComponent],
      providers: [
        { provide: PoolsStore, useValue: storeMock },
        { provide: Router, useValue: routerSpy },
      ],
    })
      // IMPORTANT: avoid rendering template (ui-text-input has no CVA in tests)
      .overrideComponent(PoolsListPageComponent, { set: { template: '' } });

    const fixture = TestBed.createComponent(PoolsListPageComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    return { fixture, component, routerSpy, store: storeMock };
  };

  it('should call store.loadAll() in constructor', () => {
    const storeMock = makeStoreMock();
    setup(storeMock);

    expect(storeMock.loadAll).toHaveBeenCalledTimes(1);
  });

  it('filtered() should return all pools when query is empty', () => {
    const pools: QuestionPool[] = [
      { id: '1', name: 'Alpha', code: 'alpha' } as QuestionPool,
      { id: '2', name: 'Beta', code: 'beta' } as QuestionPool,
    ];

    const storeMock = makeStoreMock(pools);
    const { component } = setup(storeMock);

    component.queryCtrl.setValue('');
    expect(component.filtered()).toEqual(pools);
  });

  it('filtered() should filter by name (case-insensitive)', () => {
    const pools: QuestionPool[] = [
      { id: '1', name: 'My Pool', code: 'code-1' } as QuestionPool,
      { id: '2', name: 'Other', code: 'code-2' } as QuestionPool,
    ];

    const storeMock = makeStoreMock(pools);
    const { component } = setup(storeMock);

    component.queryCtrl.setValue('poOL');
    expect(component.filtered().map((p) => p.id)).toEqual(['1']);
  });

  it('filtered() should filter by code (case-insensitive)', () => {
    const pools: QuestionPool[] = [
      { id: '1', name: 'Alpha', code: 'abc-123' } as QuestionPool,
      { id: '2', name: 'Beta', code: 'zzz-999' } as QuestionPool,
    ];

    const storeMock = makeStoreMock(pools);
    const { component } = setup(storeMock);

    component.queryCtrl.setValue('ABC');
    expect(component.filtered().map((p) => p.id)).toEqual(['1']);
  });

  it('trackById() should return item.id', () => {
    const storeMock = makeStoreMock();
    const { component } = setup(storeMock);

    const item = { id: 'pool-42' } as QuestionPool;
    expect(component.trackById(0, item)).toBe('pool-42');
  });

  it('onRetry() should call store.loadAll()', () => {
    const storeMock = makeStoreMock();
    const { component } = setup(storeMock);

    storeMock.loadAll.calls.reset();

    component.onRetry();
    expect(storeMock.loadAll).toHaveBeenCalledTimes(1);
  });

  it('onCreate() should navigate to /pools/new', () => {
    const storeMock = makeStoreMock();
    const { component, routerSpy } = setup(storeMock);

    routerSpy.navigate.and.resolveTo(true);

    component.onCreate();

    expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/pools/new']);
  });
});
