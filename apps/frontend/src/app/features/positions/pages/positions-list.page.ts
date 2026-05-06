import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, forkJoin, map, startWith } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PositionsApiService, PositionDto } from '@features/positions/services/positions-api.service';

import { UiBadgeComponent, UiBadgeTone } from '@lib-ui/badge/badge.component';

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
    UiBadgeComponent,
  ],
  templateUrl: './positions-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionsListPage {
  private readonly api = inject(PositionsApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  private readonly positionsSubject = new BehaviorSubject<PositionDto[]>([]);
  readonly positions$ = this.positionsSubject.asObservable();
  private readonly appliedCountByPositionSubject = new BehaviorSubject<Record<number, number>>({});
  readonly appliedCountByPosition$ = this.appliedCountByPositionSubject.asObservable();

  readonly searchCtrl = new FormControl('', { nonNullable: true });

  readonly filteredPositions$ = combineLatest([
    this.positions$,
    this.searchCtrl.valueChanges.pipe(startWith(this.searchCtrl.value)),
  ]).pipe(
    map(([positions, search]) => {
      const s = search.trim().toLowerCase();

      return positions.filter((p) => {
        const searchable = [
          p.title,
          p.location,
          p.contract_type,
          p.department,
          p.description,
        ].filter(Boolean).join(' ').toLowerCase();

        return !s || searchable.includes(s);
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
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    return { label: 'ACTIVE', tone: 'success' };
  }

  getAppliedCount(positionId: number, counts: Record<number, number>): number {
    return counts[positionId] ?? 0;
  }
}
