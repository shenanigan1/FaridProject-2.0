import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, forkJoin, map, startWith } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PositionsApiService, PositionDto } from '@features/positions/services/positions-api.service';

import { UiBadgeComponent, UiBadgeTone } from '@lib-ui/badge/badge.component';
import { UiSelectComponent, UiSelectOption } from '@lib-ui/select/select.component';
import { UiTextInputComponent } from '@lib-ui/text-input/text-input.component';

type LocationValue = 'all' | 'chicago' | 'dallas' | 'phoenix' | 'remote';
type TruckTypeValue = 'all' | 'long-haul' | 'dry-van' | 'tanker' | 'flatbed';
type PriorityValue = 'all' | 'urgent' | 'medium' | 'low';

interface BadgeVm {
  label: string;
  tone: UiBadgeTone;
}

interface Paginated<T> { results: T[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArrayOrResults<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value;

  if (isRecord(value)) {
    const maybePaginated = value as Partial<Paginated<T>>;
    if (Array.isArray(maybePaginated.results)) {
      return maybePaginated.results;
    }
  }

  return [];
}

@Component({
  standalone: true,
  selector: 'app-positions-list-page',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    UiSelectComponent,
    UiBadgeComponent,
    UiTextInputComponent,
  ],
  templateUrl: './positions-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionsListPage {
  private readonly api = inject(PositionsApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly positionsSubject = new BehaviorSubject<PositionDto[]>([]);
  readonly positions$ = this.positionsSubject.asObservable();
  private readonly appliedCountByPositionSubject = new BehaviorSubject<Record<number, number>>({});
  readonly appliedCountByPosition$ = this.appliedCountByPositionSubject.asObservable();

  // Search + dropdown filters
  readonly searchCtrl = new FormControl('', { nonNullable: true });
  readonly locationCtrl = new FormControl<LocationValue>('all', { nonNullable: true });
  readonly truckTypeCtrl = new FormControl<TruckTypeValue>('all', { nonNullable: true });
  readonly priorityCtrl = new FormControl<PriorityValue>('all', { nonNullable: true });

  // Dropdown options (CVA select)
  readonly locationOptions: UiSelectOption<LocationValue>[] = [
    { label: 'Location', value: 'all' },
    { label: 'Chicago, IL', value: 'chicago' },
    { label: 'Dallas, TX', value: 'dallas' },
    { label: 'Phoenix, AZ', value: 'phoenix' },
    { label: 'Remote', value: 'remote' },
  ];

  readonly truckTypeOptions: UiSelectOption<TruckTypeValue>[] = [
    { label: 'Truck Type', value: 'all' },
    { label: 'Long Haul', value: 'long-haul' },
    { label: 'Dry Van', value: 'dry-van' },
    { label: 'Tanker', value: 'tanker' },
    { label: 'Flatbed', value: 'flatbed' },
  ];

  readonly priorityOptions: UiSelectOption<PriorityValue>[] = [
    { label: 'Priority', value: 'all' },
    { label: 'Urgent', value: 'urgent' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' },
  ];

  readonly filteredPositions$ = combineLatest([
    this.positions$,
    this.searchCtrl.valueChanges.pipe(startWith(this.searchCtrl.value)),
    this.locationCtrl.valueChanges.pipe(startWith(this.locationCtrl.value)),
    this.truckTypeCtrl.valueChanges.pipe(startWith(this.truckTypeCtrl.value)),
    this.priorityCtrl.valueChanges.pipe(startWith(this.priorityCtrl.value)),
  ]).pipe(
    map(([positions, search, location, truckType, priority]) => {
      const s = search.trim().toLowerCase();

      return positions.filter((p) => {
        const matchesSearch = !s || p.title.toLowerCase().includes(s);

        const loc = (p.location ?? '').toLowerCase();
        const matchesLocation =
          location === 'all' ||
          (location === 'remote' && loc.includes('remote')) ||
          (location === 'chicago' && loc.includes('chicago')) ||
          (location === 'dallas' && loc.includes('dallas')) ||
          (location === 'phoenix' && loc.includes('phoenix'));

        const blob = `${p.title} ${p.department ?? ''} ${p.description ?? ''}`.toLowerCase();
        const matchesTruckType =
          truckType === 'all' ||
          (truckType === 'long-haul' && blob.includes('long')) ||
          (truckType === 'dry-van' && blob.includes('dry')) ||
          (truckType === 'tanker' && blob.includes('tanker')) ||
          (truckType === 'flatbed' && blob.includes('flatbed'));

        const title = p.title.toLowerCase();
        const matchesPriority =
          priority === 'all' ||
          (priority === 'urgent' && title.includes('senior')) ||
          (priority === 'medium' && title.includes('tanker')) ||
          (priority === 'low' && p.is_active === false);

        return matchesSearch && matchesLocation && matchesTruckType && matchesPriority;
      });
    }),
  );

  isLoading = true;
  error: string | null = null;

  constructor() {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();

    forkJoin({
      positions: this.api.list(),
      applicationCounts: this.api.listApplicationCounts(),
    })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ({ positions, applicationCounts }) => {
          const list = asArrayOrResults<PositionDto>(positions);
          this.positionsSubject.next(list);
          this.appliedCountByPositionSubject.next(applicationCounts);

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Unable to load positions.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  getBadge(p: PositionDto): BadgeVm {
    if (p.is_active === false) return { label: 'INACTIVE', tone: 'neutral' };

    const t = p.title.toLowerCase();
    if (t.includes('senior')) return { label: 'URGENT', tone: 'danger' };
    if (t.includes('tanker')) return { label: 'MEDIUM', tone: 'warning' };

    return { label: 'ACTIVE', tone: 'success' };
  }

  getAppliedCount(positionId: number, counts: Record<number, number>): number {
    return counts[positionId] ?? 0;
  }
}
