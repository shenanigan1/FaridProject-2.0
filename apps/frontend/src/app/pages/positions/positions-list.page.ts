import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PositionsApiService, PositionDto } from '../../features/positions/services/positions-api.service';

type SelectOption<T extends string> = { label: string; value: T };

type LocationValue = 'all' | 'chicago' | 'dallas' | 'phoenix' | 'remote';
type TruckTypeValue = 'all' | 'long-haul' | 'dry-van' | 'tanker' | 'flatbed';
type PriorityValue = 'all' | 'urgent' | 'medium' | 'low';

@Component({
  standalone: true,
  selector: 'app-positions-list-page',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './positions-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionsListPage {
  private readonly positionsSubject = new BehaviorSubject<PositionDto[]>([]);
  readonly positions$ = this.positionsSubject.asObservable();

  // Search + dropdown filters
  readonly searchCtrl = new FormControl('', { nonNullable: true });
  readonly locationCtrl = new FormControl<LocationValue>('all', { nonNullable: true });
  readonly truckTypeCtrl = new FormControl<TruckTypeValue>('all', { nonNullable: true });
  readonly priorityCtrl = new FormControl<PriorityValue>('all', { nonNullable: true });

  // Dropdown options
  readonly locationOptions: SelectOption<LocationValue>[] = [
    { label: 'Location', value: 'all' },
    { label: 'Chicago, IL', value: 'chicago' },
    { label: 'Dallas, TX', value: 'dallas' },
    { label: 'Phoenix, AZ', value: 'phoenix' },
    { label: 'Remote', value: 'remote' },
  ];

  readonly truckTypeOptions: SelectOption<TruckTypeValue>[] = [
    { label: 'Truck Type', value: 'all' },
    { label: 'Long Haul', value: 'long-haul' },
    { label: 'Dry Van', value: 'dry-van' },
    { label: 'Tanker', value: 'tanker' },
    { label: 'Flatbed', value: 'flatbed' },
  ];

  readonly priorityOptions: SelectOption<PriorityValue>[] = [
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

        const matchesPriority =
          priority === 'all' ||
          (priority === 'urgent' && p.title.toLowerCase().includes('senior')) ||
          (priority === 'medium' && p.title.toLowerCase().includes('tanker')) ||
          (priority === 'low' && p.is_active === false);

        return matchesSearch && matchesLocation && matchesTruckType && matchesPriority;
      });
    })
  );

  isLoading = true;
  error: string | null = null;

  constructor(
    private readonly api: PositionsApiService,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck(); // ✅ ensure UI shows loading immediately

    this.api.list().subscribe({
      next: (data) => {
        // If your API returns { results: [...] } sometimes:
        const list = Array.isArray(data) ? data : ((data as any)?.results ?? []);
        this.positionsSubject.next(list);

        this.isLoading = false;
        this.cdr.markForCheck(); // ✅ FIX: release loading without user interaction
      },
      error: () => {
        this.error = 'Unable to load positions.';
        this.isLoading = false;
        this.cdr.markForCheck(); // ✅ FIX
      },
    });
  }

  getBadge(p: PositionDto): { label: string; tone: 'urgent' | 'medium' | 'active' | 'low' } {
    if (p.is_active === false) return { label: 'INACTIVE', tone: 'low' };
    const t = p.title.toLowerCase();
    if (t.includes('senior')) return { label: 'URGENT', tone: 'urgent' };
    if (t.includes('tanker')) return { label: 'MEDIUM', tone: 'medium' };
    return { label: 'ACTIVE', tone: 'active' };
  }

  badgeClass(tone: 'urgent' | 'medium' | 'active' | 'low'): string {
    switch (tone) {
      case 'urgent':
        return 'bg-red-500/15 text-red-300 border border-red-500/25';
      case 'medium':
        return 'bg-amber-500/15 text-amber-300 border border-amber-500/25';
      case 'active':
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25';
      default:
        return 'bg-slate-500/15 text-slate-300 border border-slate-500/25';
    }
  }
}
