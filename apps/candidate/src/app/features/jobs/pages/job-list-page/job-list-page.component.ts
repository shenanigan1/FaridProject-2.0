import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { JobCardComponent } from '@jobs/components/job-card/job-card.component';
import { JobFiltersComponent } from '@jobs/components/job-filters/job-filters.component';
import { JobOffer, JobOfferFilters } from '@jobs/models/job-offer.model';
import { JobPublicApiService } from '@jobs/services/job-public-api.service';

type JobListViewState =
  | { kind: 'loading' }
  | { kind: 'loaded'; jobs: JobOffer[]; total: number }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };

@Component({
  selector: 'app-job-list-page',
  standalone: true,
  imports: [CommonModule, JobCardComponent, JobFiltersComponent],
  templateUrl: './job-list-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobListPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly jobsPublicApiService = inject(JobPublicApiService);

  protected filters: JobOfferFilters = {
    search: '',
    location: '',
    employmentType: '',
    priority: '',
    page: 1,
  };

  protected state: JobListViewState = { kind: 'loading' };

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        map((params) => {
          const page = Number(params.get('page') ?? 1);

          const nextFilters: JobOfferFilters = {
            search: params.get('search') ?? '',
            location: params.get('location') ?? '',
            employmentType: params.get('employmentType') ?? '',
            priority: params.get('priority') ?? '',
            page: Number.isNaN(page) || page < 1 ? 1 : page,
          };

          this.filters = nextFilters;
          this.state = { kind: 'loading' };

          return nextFilters;
        }),
        switchMap((filters) =>
          this.jobsPublicApiService.getJobOffers(filters).pipe(
            map((response) => {
              if (response.results.length === 0) {
                return { kind: 'empty' } as JobListViewState;
              }

              return {
                kind: 'loaded',
                jobs: response.results,
                total: response.count,
              } as JobListViewState;
            }),
            catchError(() =>
              of({
                kind: 'error',
                message: 'An error occurred while loading job offers.',
              } as JobListViewState),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => {
        this.state = state;
      });
  }

  protected onFiltersChange(filters: Omit<JobOfferFilters, 'page'>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: filters.search || null,
        location: filters.location || null,
        employmentType: filters.employmentType || null,
        priority: filters.priority || null,
        page: 1,
      },
      queryParamsHandling: '',
    });
  }

  protected onResetFilters(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  protected trackByJobId(_: number, job: JobOffer): string {
    return job.id;
  }
}
