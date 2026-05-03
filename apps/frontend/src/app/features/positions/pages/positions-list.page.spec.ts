import { TestBed } from '@angular/core/testing';
import { of, firstValueFrom, take } from 'rxjs';

import { PositionsListPage } from './positions-list.page';
import { PositionsApiService, PositionDto } from '@features/positions/services/positions-api.service';

interface PositionsApiServiceMock {
  list: jasmine.Spy<() => ReturnType<PositionsApiService['list']>>;
  listApplicationCounts: jasmine.Spy<() => ReturnType<PositionsApiService['listApplicationCounts']>>;
}

function makeApiMock(initial: unknown = []): PositionsApiServiceMock {
  return {
    list: jasmine.createSpy('list').and.returnValue(of(initial)),
    listApplicationCounts: jasmine.createSpy('listApplicationCounts').and.returnValue(of({})),
  };
}

const makePosition = (overrides: Partial<PositionDto> = {}): PositionDto => {
  const now = new Date().toISOString();

  return {
    id: 1,
    created_at: now,
    updated_at: now,

    // Mets-le si ton PositionDto l’exige (ça ne gêne pas s’il est optionnel)
    company: 1,

    title: 'Driver',
    description: '',
    department: 'Ops',
    contract_type: 'Full-time',
    location: 'Chicago',
    salary: null,
    is_active: true,

    ...overrides,
  };
};

describe('PositionsListPage', () => {
  const setup = (opts?: { apiData?: unknown }) => {
    const apiMock = makeApiMock(opts?.apiData ?? []);

    TestBed.configureTestingModule({
      imports: [PositionsListPage],
      providers: [{ provide: PositionsApiService, useValue: apiMock }],
    });

    // ✅ évite les soucis de CVA (ui-text-input / app-ui-select) dans le template
    TestBed.overrideComponent(PositionsListPage, { set: { template: '' } });

    const fixture = TestBed.createComponent(PositionsListPage);
    fixture.detectChanges(); // ctor -> load()
    return { fixture, component: fixture.componentInstance, apiMock };
  };

  it('should call api.list() on init', () => {
    const { apiMock } = setup();
    expect(apiMock.list).toHaveBeenCalledTimes(1);
    expect(apiMock.listApplicationCounts).toHaveBeenCalledTimes(1);
  });

  it('should accept paginated API payloads { results: PositionDto[] }', async () => {
    const data = { results: [makePosition({ id: 7, title: 'Driver 7' })] };
    const { component, apiMock } = setup({ apiData: data });

    expect(apiMock.list).toHaveBeenCalledTimes(1);

    const positions = await firstValueFrom(component.positions$.pipe(take(1)));
    expect(positions.length).toBe(1);
    expect(positions[0].id).toBe(7);
  });

  it('getBadge() should return INACTIVE when is_active === false', () => {
    const { component } = setup();
    const p = makePosition({ is_active: false, title: 'Driver' });

    expect(component.getBadge(p)).toEqual({ label: 'INACTIVE', tone: 'neutral' });
  });

  it('getBadge() should return ACTIVE from backend status, without title-derived priority', () => {
    const { component } = setup();
    const p = makePosition({ title: 'Senior Driver', is_active: true });

    expect(component.getBadge(p)).toEqual({ label: 'ACTIVE', tone: 'success' });
  });

  it('getBadge() should return ACTIVE by default', () => {
    const { component } = setup();
    const p = makePosition({ title: 'Driver', is_active: true });

    expect(component.getBadge(p)).toEqual({ label: 'ACTIVE', tone: 'success' });
  });

  it('getAppliedCount() should return application count for a position', () => {
    const { component } = setup();
    expect(component.getAppliedCount(12, { 12: 5 })).toBe(5);
    expect(component.getAppliedCount(99, { 12: 5 })).toBe(0);
  });
});
