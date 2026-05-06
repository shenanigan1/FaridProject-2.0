import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router, UrlTree } from '@angular/router';
import { Signal, WritableSignal, signal } from '@angular/core';

import { PoolEditorPageComponent } from './pool-editor.page';
import { PoolsStore } from '@features/pools/services/pools.store';
import { normalizePoolCode } from '@features/pools/models/pool-code';

interface PoolLike {
  id: string;
  name?: string | null;
  code?: string | null;
  description?: string | null;
}

interface CreatePoolDto {
  name: string;
  code: string;
  description: string;
}

type UpdatePoolDto = CreatePoolDto;

interface PoolsStoreMock {
  isLoading: Signal<boolean>;
  error: Signal<string | null>;
  selectedPool: WritableSignal<PoolLike | null>;

  loadOne: jasmine.Spy<(id: string) => void>;
  create: jasmine.Spy<(dto: CreatePoolDto, onSuccess: (created: PoolLike) => void) => void>;
  update: jasmine.Spy<(id: string, dto: UpdatePoolDto, onSuccess: () => void) => void>;
}

const validCode = (raw: string): string => normalizePoolCode(raw);

describe('PoolEditorPageComponent', () => {
  const makeStoreMock = (): PoolsStoreMock => ({
    isLoading: signal(false),
    error: signal<string | null>(null),
    selectedPool: signal<PoolLike | null>(null),

    loadOne: jasmine.createSpy<(id: string) => void>('loadOne'),
    create: jasmine.createSpy<(dto: CreatePoolDto, onSuccess: (created: PoolLike) => void) => void>('create'),
    update: jasmine.createSpy<(id: string, dto: UpdatePoolDto, onSuccess: () => void) => void>('update'),
  });

  const makeRoute = (id: string | null): ActivatedRoute =>
    ({
      snapshot: { paramMap: convertToParamMap(id ? { id } : {}) },
    } as ActivatedRoute);

  const makeRouterMock = (): jasmine.SpyObj<Router> => {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl', 'createUrlTree']);
    router.navigate.and.returnValue(Promise.resolve(true));
    router.navigateByUrl.and.returnValue(Promise.resolve(true));
    router.createUrlTree.and.returnValue({} as UrlTree);
    return router;
  };

  const setup = (opts: { id: string | null; store?: PoolsStoreMock }): {
    fixture: ComponentFixture<PoolEditorPageComponent>;
    component: PoolEditorPageComponent;
    storeMock: PoolsStoreMock;
    routerMock: jasmine.SpyObj<Router>;
  } => {
    const storeMock = opts.store ?? makeStoreMock();
    const routerMock = makeRouterMock();

    TestBed.configureTestingModule({
      imports: [PoolEditorPageComponent],
      providers: [
        { provide: PoolsStore, useValue: storeMock },
        { provide: ActivatedRoute, useValue: makeRoute(opts.id) },
        { provide: Router, useValue: routerMock },
      ],
    });

    const fixture = TestBed.createComponent(PoolEditorPageComponent);
    fixture.detectChanges();

    return { fixture, component: fixture.componentInstance, storeMock, routerMock };
  };

  it('should init in create mode when route has no id', () => {
    const { component, storeMock } = setup({ id: null });

    expect(component.pageMode()).toBe('create');
    expect(component.poolId()).toBeNull();
    expect(component.isEditing()).toBeTrue();
    expect(component.tab()).toBe('settings');
    expect(storeMock.loadOne).not.toHaveBeenCalled();
  });

  it('should init in detail mode and load pool when route has an id', () => {
    const { component, storeMock } = setup({ id: '42' });

    expect(component.pageMode()).toBe('detail');
    expect(component.poolId()).toBe('42');
    expect(component.isEditing()).toBeFalse();
    expect(component.tab()).toBe('questions');
    expect(storeMock.loadOne).toHaveBeenCalledOnceWith('42');
  });

  it('back() should navigate to /pools', () => {
    const { component, routerMock } = setup({ id: null });

    component.back();

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/pools');
  });

  it('retry() should reload when poolId exists', () => {
    const { component, storeMock } = setup({ id: '99' });

    component.retry();

    expect(storeMock.loadOne).toHaveBeenCalledWith('99');
  });

  it('startEdit() should fill the form and switch to editing + settings tab', () => {
    const storeMock = makeStoreMock();
    storeMock.selectedPool.set({
      id: 'p1',
      name: 'My Pool',
      code: validCode('My Pool'),
      description: 'desc',
    });

    const { component } = setup({ id: 'p1', store: storeMock });

    component.startEdit();

    expect(component.isEditing()).toBeTrue();
    expect(component.tab()).toBe('settings');
    expect(component.form.controls.name.value).toBe('My Pool');
    expect(component.form.controls.code.value).toBe(validCode('My Pool'));
    expect(component.form.controls.description.value).toBe('desc');
  });

  it('cancelEdit() should navigate back in create mode', () => {
    const { component, routerMock } = setup({ id: null });

    component.cancelEdit();

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/pools');
  });

  it('cancelEdit() should exit editing in detail mode', () => {
    const { component, routerMock } = setup({ id: '42' });

    component.isEditing.set(true);

    component.cancelEdit();

    expect(component.isEditing()).toBeFalse();
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });

  it('normalizeCode() should normalize the code field', () => {
    const { component } = setup({ id: null });

    component.form.controls.code.setValue('  aB-c  ');
    component.normalizeCode();

    expect(component.form.controls.code.value).toBe(normalizePoolCode('  aB-c  '));
  });

  it('submit() should mark touched and do nothing when form is invalid', () => {
    const { component, storeMock } = setup({ id: null });

    component.submit();

    expect(component.form.touched).toBeTrue();
    expect(storeMock.create).not.toHaveBeenCalled();
    expect(storeMock.update).not.toHaveBeenCalled();
  });

  it('submit() should call store.create in create mode with trimmed dto', () => {
    const { component, storeMock } = setup({ id: null });

    component.form.controls.name.setValue('  Pool Name  ');
    component.form.controls.code.setValue(validCode('  Pool Code  '));
    component.form.controls.description.setValue('  hello  ');

    expect(component.form.valid).toBeTrue();
    expect(component.isLoading()).toBeFalse();

    component.submit();

    expect(storeMock.create).toHaveBeenCalledTimes(1);

    const [dto, cb] = storeMock.create.calls.mostRecent().args;
    expect(dto).toEqual({
      name: 'Pool Name',
      code: validCode('Pool Code'),
      description: 'hello',
    });
    expect(cb).toEqual(jasmine.any(Function));
  });

  it('submit() should navigate to the created pool questions page so questions can be added', () => {
    const { component, storeMock, routerMock } = setup({ id: null });

    component.form.controls.name.setValue('  Pool Name  ');
    component.form.controls.code.setValue(validCode('Pool Code'));
    component.form.controls.description.setValue('');
    component.submit();

    const [, cb] = storeMock.create.calls.mostRecent().args;
    cb({ id: 'p-new', name: 'Pool Name', code: 'POOL_CODE', description: '' });

    expect(routerMock.navigate).toHaveBeenCalledWith(['/pools', 'p-new']);
  });

  it('submit() should call store.update in detail mode with trimmed dto', () => {
    const storeMock = makeStoreMock();
    storeMock.selectedPool.set({
      id: 'p42',
      name: 'Old',
      code: validCode('old code'),
      description: '',
    });

    const { component } = setup({ id: 'p42', store: storeMock });

    component.form.controls.name.setValue('  New Name  ');
    component.form.controls.code.setValue(validCode('  New Code  '));
    component.form.controls.description.setValue(null);

    expect(component.pool()).not.toBeNull();
    expect(component.form.valid).toBeTrue();
    expect(component.isLoading()).toBeFalse();

    component.submit();

    expect(storeMock.update).toHaveBeenCalledTimes(1);

    const [id, dto, cb] = storeMock.update.calls.mostRecent().args;
    expect(id).toBe('p42');
    expect(dto).toEqual({
      name: 'New Name',
      code: validCode('New Code'),
      description: '',
    });
    expect(cb).toEqual(jasmine.any(Function));
  });
});
