import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, take } from 'rxjs';

import { PositionsListPage } from '@positions/pages/positions-list.page';
import {
  Paginated,
  PositionDto,
  PositionsApiService,
} from '@features/positions/services/positions-api.service';

interface PositionsApiServiceMock {
  list: jasmine.Spy<() => ReturnType<PositionsApiService['list']>>;
  listApplicationCounts: jasmine.Spy<() => ReturnType<PositionsApiService['listApplicationCounts']>>;
}

function makeApiMock(initial: PositionDto[] | Paginated<PositionDto> = []): PositionsApiServiceMock {
  return {
    list: jasmine.createSpy('list').and.returnValue(of(initial)),
    listApplicationCounts: jasmine.createSpy('listApplicationCounts').and.returnValue(of({})),
  };
}

function makePosition(overrides: Partial<PositionDto> = {}): PositionDto {
  const now = new Date().toISOString();

  const base: PositionDto = {
    id: 1,
    created_at: now,
    updated_at: now,

    company: 1,
    title: 'Driver',
    description: '',
    department: 'Ops',
    contract_type: 'Full-time',
    location: 'Chicago',
    salary: null,
    is_active: true,
  };

  return { ...base, ...overrides };
}

describe('PositionsListPage', () => {
  const setup = (opts?: { apiData?: PositionDto[] | Paginated<PositionDto> }) => {
    const apiMock = makeApiMock(opts?.apiData ?? []);

    TestBed.configureTestingModule({
      imports: [PositionsListPage],
      providers: [{ provide: PositionsApiService, useValue: apiMock }],
    });

    // ✅ évite les erreurs NG01203 (CVA) dues aux composants de formulaire custom dans le template
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

  it('should accept list API payloads (PositionDto[])', async () => {
    const apiData: PositionDto[] = [makePosition({ id: 7, title: 'Driver 7' })];
    const { component, apiMock } = setup({ apiData });

    expect(apiMock.list).toHaveBeenCalledTimes(1);

    const positions = await firstValueFrom(component.positions$.pipe(take(1)));
    expect(positions.length).toBe(1);
    expect(positions[0].id).toBe(7);
  });

  it('should accept paginated API payloads { results: PositionDto[] }', async () => {
    const apiData: Paginated<PositionDto> = {
      results: [makePosition({ id: 8, title: 'Driver 8' })],
    };
    const { component, apiMock } = setup({ apiData });

    expect(apiMock.list).toHaveBeenCalledTimes(1);

    const positions = await firstValueFrom(component.positions$.pipe(take(1)));
    expect(positions.length).toBe(1);
    expect(positions[0].id).toBe(8);
  });

  it('getBadge() should return INACTIVE when is_active === false', () => {
    const { component } = setup();
    const p = makePosition({ is_active: false, title: 'Driver' });

    expect(component.getBadge(p)).toEqual({ label: 'INACTIVE', tone: 'neutral' });
  });

  it('getBadge() should return URGENT when title includes "senior"', () => {
    const { component } = setup();
    const p = makePosition({ title: 'Senior Driver', is_active: true });

    expect(component.getBadge(p)).toEqual({ label: 'URGENT', tone: 'danger' });
  });

  it('getBadge() should return MEDIUM when title includes "tanker"', () => {
    const { component } = setup();
    const p = makePosition({ title: 'Tanker Driver', is_active: true });

    expect(component.getBadge(p)).toEqual({ label: 'MEDIUM', tone: 'warning' });
  });

  it('getBadge() should return ACTIVE by default', () => {
    const { component } = setup();
    const p = makePosition({ title: 'Driver', is_active: true });

    expect(component.getBadge(p)).toEqual({ label: 'ACTIVE', tone: 'success' });
  });
});
