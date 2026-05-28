import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { TestTemplateEditorPage } from './test-templates-editor.page';
import { TemplatesApi } from '@features/test-templates/services/test-templates.api';
import { PoolsStore } from '@features/pools/services/pools.store';
import { QuestionPool } from '@features/pools/models/question-pool.model';

interface TemplatesApiMock {
  get: jasmine.Spy<(id: number) => ReturnType<TemplatesApi['get']>>;
  create: jasmine.Spy<(payload: unknown) => ReturnType<TemplatesApi['create']>>;
  update: jasmine.Spy<(id: number, payload: unknown) => ReturnType<TemplatesApi['update']>>;
}

function makeTemplatesApiMock(opts?: {
  getResult?: unknown;
  createResult?: unknown;
  updateResult?: unknown;
  getError?: unknown;
  createError?: unknown;
  updateError?: unknown;
}): TemplatesApiMock {
  return {
    get: jasmine
      .createSpy('get')
      .and.returnValue(opts?.getError ? throwError(() => opts.getError) : of(opts?.getResult ?? {})),
    create: jasmine
      .createSpy('create')
      .and.returnValue(
        opts?.createError ? throwError(() => opts.createError) : of(opts?.createResult ?? { id: 123 }),
      ),
    update: jasmine
      .createSpy('update')
      .and.returnValue(
        opts?.updateError ? throwError(() => opts.updateError) : of(opts?.updateResult ?? { id: 1 }),
      ),
  };
}

interface PoolsStoreMock {
  pools: () => QuestionPool[];
  isLoading: () => boolean;
  error: () => string | null;
  loadAll: jasmine.Spy<() => void>;
}

function makePoolsStoreMock(initialPools: QuestionPool[] = []): PoolsStoreMock {
  const poolsSig = signal<QuestionPool[]>(initialPools);
  const loadingSig = signal(false);
  const errorSig = signal<string | null>(null);

  return {
    pools: () => poolsSig(),
    isLoading: () => loadingSig(),
    error: () => errorSig(),
    loadAll: jasmine.createSpy('loadAll'),
  };
}

interface RouterMock {
  navigate: jasmine.Spy<(commands: unknown[]) => Promise<boolean>>;
  navigateByUrl: jasmine.Spy<(url: string) => Promise<boolean>>;
}

function makeRouterMock(): RouterMock {
  return {
    navigate: jasmine.createSpy('navigate').and.resolveTo(true),
    navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true),
  };
}

function makeRouteMock(id: string | null): Pick<ActivatedRoute, 'snapshot'> {
  return {
    snapshot: {
      paramMap: convertToParamMap(id ? { id } : {}),
    } as ActivatedRoute['snapshot'],
  };
}

function makeReadyTemplate(component: TestTemplateEditorPage): void {
  component.form.controls.name.setValue('Driver Safety Test');
  component.form.controls.duration_minutes.setValue(60);
  component.form.controls.min_pass_score.setValue(80);
  component.addSection();
  const sectionId = component.sections()[0].id;
  component.updateSectionTitle(sectionId, 'Conduite terrain');
  component.updateSectionWeight(sectionId, 100);
  component.attachPoolToSection(sectionId, 'p1');
}

describe('TestTemplateEditorPage', () => {
  const pools: QuestionPool[] = [
    { id: 'p1', code: 'SAF', name: 'Safety', description: '', updatedAt: new Date().toISOString() },
    { id: 'p2', code: 'HR', name: 'HR Basics', description: '', updatedAt: new Date().toISOString() },
  ];

  const setup = (opts?: {
    routeId?: string | null;
    api?: Parameters<typeof makeTemplatesApiMock>[0];
    pools?: QuestionPool[];
  }): {
    fixture: ComponentFixture<TestTemplateEditorPage>;
    component: TestTemplateEditorPage;
    apiMock: TemplatesApiMock;
    poolsStoreMock: PoolsStoreMock;
    routerMock: RouterMock;
  } => {
    const apiMock = makeTemplatesApiMock(opts?.api);
    const poolsStoreMock = makePoolsStoreMock(opts?.pools ?? pools);
    const routerMock = makeRouterMock();
    const routeMock = makeRouteMock(opts?.routeId ?? null);

    TestBed.configureTestingModule({
      imports: [TestTemplateEditorPage],
      providers: [
        { provide: TemplatesApi, useValue: apiMock },
        { provide: PoolsStore, useValue: poolsStoreMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    });

    const fixture = TestBed.createComponent(TestTemplateEditorPage);
    fixture.detectChanges();

    return { fixture, component: fixture.componentInstance, apiMock, poolsStoreMock, routerMock };
  };

  it('should call poolsStore.loadAll() on construction', () => {
    const { poolsStoreMock } = setup({ routeId: null });
    expect(poolsStoreMock.loadAll).toHaveBeenCalledTimes(1);
  });

  it('should start in create mode when route has no id', () => {
    const { component } = setup({ routeId: null });
    expect(component.mode()).toBe('create');
    expect(component.isEditMode()).toBeTrue();
  });

  it('should start in view mode and load template when route has id', () => {
    const { component, apiMock } = setup({
      routeId: '7',
      api: {
        getResult: {
          id: 7,
          name: 'Template A',
          duration_minutes: 60,
          min_pass_score: 70,
          difficulty: 'hard',
          is_active: true,
          sections: [],
        },
      },
    });

    expect(component.mode()).toBe('edit');
    expect(apiMock.get).toHaveBeenCalledWith(7);
    expect(component.form.controls.name.value).toBe('Template A');
    expect(component.form.disabled).toBeFalse();
  });

  it('should render the Figma single-page editor with general info, sections and pools together', () => {
    const { fixture, component } = setup({ routeId: null });

    component.addSection();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('INFORMATIONS GENERALES');
    expect(text).toContain('STRUCTURE DU TEST');
    expect(text).toContain('Ajouter un Pool');
    expect(text).toContain('Ajouter une Section');
    expect(text).toContain('Enregistrer le Template');
  });

  it('filteredPools() should filter by name/code (case-insensitive)', () => {
    const { component } = setup({ routeId: null, pools });

    component.setPoolSearch('saF');
    const r1 = component.filteredPools();
    expect(r1.length).toBe(1);
    expect(r1[0].id).toBe('p1');

    component.setPoolSearch('hr');
    const r2 = component.filteredPools();
    expect(r2.length).toBe(1);
    expect(r2[0].id).toBe('p2');
  });

  it('toggleEdit() should keep existing templates editable in manage mode', () => {
    const { component } = setup({
      routeId: '9',
      api: {
        getResult: {
          id: 9,
          name: 'X',
          duration_minutes: 45,
          min_pass_score: 80,
          difficulty: 'medium',
          is_active: true,
          sections: [],
        },
      },
    });

    expect(component.mode()).toBe('edit');
    component.toggleEdit();

    expect(component.mode()).toBe('edit');
    expect(component.form.disabled).toBeFalse();
  });

  it('cancelEdit() should restore snapshot and keep existing template in manage mode', () => {
    const { component } = setup({
      routeId: '10',
      api: {
        getResult: {
          id: 10,
          name: 'Original',
          duration_minutes: 50,
          min_pass_score: 80,
          difficulty: 'medium',
          is_active: true,
          sections: [],
        },
      },
    });

    component.form.controls.name.setValue('Changed');
    component.addSection();

    component.cancelEdit();

    expect(component.mode()).toBe('edit');
    expect(component.form.controls.name.value).toBe('Original');
    expect(component.sections().length).toBe(0);
    expect(component.form.disabled).toBeFalse();
  });

  it('addSection/removeSection should update sections in edit mode', () => {
    const { component } = setup({ routeId: null }); // create -> edit mode
    expect(component.sections().length).toBe(0);

    component.addSection();
    expect(component.sections().length).toBe(1);

    const id = component.sections()[0].id;
    component.removeSection(id);
    expect(component.sections().length).toBe(0);
  });

  it('attachPoolToSection/detachPool should manage section pool rules', () => {
    const { component } = setup({ routeId: null });

    component.addSection();
    const sectionId = component.sections()[0].id;

    component.attachPoolToSection(sectionId, 'p1');
    expect(component.sections()[0].pools.length).toBe(1);
    expect(component.sections()[0].pools[0].poolId).toBe('p1');

    component.attachPoolToSection(sectionId, 'p1'); // no duplicates
    expect(component.sections()[0].pools.length).toBe(1);

    component.detachPool(sectionId, 'p1');
    expect(component.sections()[0].pools.length).toBe(0);
  });

  it('pool bottom sheet should scope selection to the active section', () => {
    const { component } = setup({ routeId: null });

    component.addSection();
    const sectionId = component.sections()[0].id;

    component.openPoolSheet(sectionId);
    expect(component.poolSheetOpen()).toBeTrue();
    expect(component.poolSheetSection()?.id).toBe(sectionId);

    component.attachPoolFromSheet('p2');

    expect(component.poolSheetOpen()).toBeFalse();
    expect(component.sections()[0].pools).toEqual([
      jasmine.objectContaining({ poolId: 'p2' }),
    ]);
  });

  it('pool bottom sheet should route to pool creation from backend library action', () => {
    const { component, routerMock } = setup({ routeId: null });

    component.createPoolFromSheet();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/pools/new']);
  });

  it('save() in create mode should call api.create and navigate to /templates/:id', async () => {
    const { component, apiMock, routerMock } = setup({
      routeId: null,
      api: { createResult: { id: 555 } },
    });

    makeReadyTemplate(component);

    component.save();

    expect(apiMock.create).toHaveBeenCalledTimes(1);

    // wait microtasks (navigate promise)
    await Promise.resolve();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/templates', 555]);
  });

  it('save() in edit mode should call api.update and return to view mode on success', () => {
    const { component, apiMock } = setup({
      routeId: '12',
      api: {
        getResult: {
          id: 12,
          name: 'EditMe',
          duration_minutes: 45,
          min_pass_score: 80,
          difficulty: 'medium',
          is_active: true,
          sections: [
            {
              id: 's1',
              title: 'Conduite terrain',
              weight: 100,
              questions: [],
              pools: [{ poolId: 'p1', randomCount: 3 }],
            },
          ],
        },
        updateResult: { id: 12 },
      },
    });

    component.toggleEdit();
    component.form.controls.name.setValue('Edited');
    component.save();

    expect(apiMock.update).toHaveBeenCalledTimes(1);
    expect(component.mode()).toBe('edit');
    expect(component.form.disabled).toBeFalse();
  });

  it('save() should set apiError when API fails', () => {
    const { component } = setup({
      routeId: null,
      api: { createError: { error: { detail: 'Nope.' } } },
    });

    makeReadyTemplate(component);
    component.save();

    expect(component.apiError()).toBe('Nope.');
  });

  it('save() should show a clear French error when required template fields are missing', () => {
    const { component, apiMock } = setup({ routeId: null });

    component.form.controls.name.setValue('');
    component.save();

    expect(apiMock.create).not.toHaveBeenCalled();
    expect(component.apiError()).toBe('Champ obligatoire');
  });

  it('save() should explain that every section needs at least one pool before calling API', () => {
    const { component, apiMock } = setup({ routeId: null });

    component.form.controls.name.setValue('Template sans pool');
    component.form.controls.duration_minutes.setValue(45);
    component.form.controls.min_pass_score.setValue(80);
    component.addSection();
    component.updateSectionTitle(component.sections()[0].id, 'Conduite');
    component.updateSectionWeight(component.sections()[0].id, 100);
    component.save();

    expect(apiMock.create).not.toHaveBeenCalled();
    expect(component.apiError()).toBe('Chaque section doit contenir au moins un pool de questions.');
  });

  it('completion() should be between 0 and 100 and increase when form is filled + weights sum to 100', () => {
    const { component } = setup({ routeId: null });

    const base = component.completion();

    component.form.controls.name.setValue('Driver Safety Test');
    component.form.controls.duration_minutes.setValue(60);
    component.form.controls.min_pass_score.setValue(80);

    component.addSection();
    const s0 = component.sections()[0].id;
    component.updateSectionWeight(s0, 100);

    const after = component.completion();

    expect(after).toBeGreaterThanOrEqual(base);
    expect(after).toBeLessThanOrEqual(100);
  });
});
