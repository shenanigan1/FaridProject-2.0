import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CandidateDto,
  CandidatesApiService,
} from '@features/candidates/services/candidates-api.service';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArrayOrResults<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (isRecord(value)) {
    const maybeResults = value['results'];
    if (Array.isArray(maybeResults)) {
      return maybeResults as T[];
    }
  }

  return [];
}

@Component({
  standalone: true,
  selector: 'app-candidates-list-page',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './candidates-list.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CandidatesListPage {
  private readonly api = inject(CandidatesApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly searchControl = new FormControl('', { nonNullable: true });

  private readonly candidatesSubject = new BehaviorSubject<CandidateDto[]>([]);
  readonly candidates$ = this.candidatesSubject.asObservable();

  readonly filteredCandidates$ = combineLatest([
    this.candidates$,
    this.searchControl.valueChanges.pipe(startWith(this.searchControl.value)),
  ]).pipe(
    map(([candidates, query]) => {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) {
        return candidates;
      }

      return candidates.filter((candidate) => {
        const fullName = `${candidate.user.first_name} ${candidate.user.last_name}`.toLowerCase();
        const email = candidate.user.email.toLowerCase();
        const phone = (candidate.user.phone ?? '').toLowerCase();

        return (
          fullName.includes(normalizedQuery) ||
          email.includes(normalizedQuery) ||
          phone.includes(normalizedQuery)
        );
      });
    }),
  );

  isLoading = true;
  errorMessage: string | null = null;

  constructor() {
    this.loadCandidates();
  }

  private loadCandidates(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.api
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (response) => {
          this.candidatesSubject.next(asArrayOrResults<CandidateDto>(response));
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.errorMessage = 'Unable to load candidates right now.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }
}
