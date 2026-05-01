import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, startWith } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideDynamicIcon } from '@lucide/angular';

import { APP_ICONS } from '@shared/icons/app-icons';
import { PositionCreatePayload, PositionDto } from '@features/positions/services/positions-api.service';
import {
  CompanyDto,
  JobsApiService,
  getJobStatus,
  matchesJobSearch,
} from '@features/jobs/services/jobs-api.service';

interface FilterOption {
  label: string;
  value: string;
}

interface JobOfferVm {
  id: number;
  title: string;
  companyName: string | null;
  location: string | null;
  contractType: string;
  department: string;
  applicants: string;
  status: 'active' | 'draft';
  dto: PositionDto;
}

type EditorMode = 'create' | 'edit';

type JobEditorForm = FormGroup<{
  company: FormControl<number | null>;
  title: FormControl<string>;
  department: FormControl<string>;
  contract_type: FormControl<string>;
  location: FormControl<string>;
  description: FormControl<string>;
  salary: FormControl<number | null>;
  is_active: FormControl<boolean>;
}>;

@Component({
  standalone: true,
  selector: 'app-jobs-page',
  imports: [CommonModule, ReactiveFormsModule, LucideDynamicIcon],
  templateUrl: './jobs.page.html',
  styleUrl: './jobs.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobsPage {
  private readonly jobsApi = inject(JobsApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly icons = APP_ICONS;

  readonly searchCtrl = new FormControl('', { nonNullable: true });
  readonly locationCtrl = new FormControl('all', { nonNullable: true });
  readonly contractTypeCtrl = new FormControl('all', { nonNullable: true });
  readonly statusCtrl = new FormControl('all', { nonNullable: true });

  readonly editorForm: JobEditorForm = new FormGroup({
    company: new FormControl<number | null>(null, {
      nonNullable: false,
      validators: [Validators.required],
    }),
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    department: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    contract_type: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    location: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    salary: new FormControl<number | null>(null),
    is_active: new FormControl(true, { nonNullable: true }),
  });

  private readonly positionsSubject = new BehaviorSubject<PositionDto[]>([]);
  private readonly applicationCountsSubject = new BehaviorSubject<Record<number, number>>({});
  private readonly companiesSubject = new BehaviorSubject<CompanyDto[]>([]);

  readonly locationOptions$ = this.positionsSubject
    .asObservable()
    .pipe(map((positions) => this.buildOptions(positions.map((position) => position.location), 'All Locations')));

  readonly contractTypeOptions$ = this.positionsSubject
    .asObservable()
    .pipe(
      map((positions) =>
        this.buildOptions(
          positions.map((position) => position.contract_type),
          'Contract Type',
        ),
      ),
    );

  readonly statusOptions$ = this.positionsSubject.asObservable().pipe(
    map((positions) => {
      const statusValues = new Set(positions.map((position) => getJobStatus(position)));
      return [
        { label: 'Status', value: 'all' },
        ...Array.from(statusValues).map((status) => ({
          label: this.toTitleCase(status),
          value: status,
        })),
      ];
    }),
  );

  readonly companies$ = this.companiesSubject.asObservable();
  readonly jobOffers$ = combineLatest([
    this.positionsSubject.asObservable(),
    this.applicationCountsSubject.asObservable(),
    this.companiesSubject.asObservable(),
    this.searchCtrl.valueChanges.pipe(startWith(this.searchCtrl.value)),
    this.locationCtrl.valueChanges.pipe(startWith(this.locationCtrl.value)),
    this.contractTypeCtrl.valueChanges.pipe(startWith(this.contractTypeCtrl.value)),
    this.statusCtrl.valueChanges.pipe(startWith(this.statusCtrl.value)),
  ]).pipe(
    map(([positions, applicationCounts, companies, query, location, contractType, status]) =>
      positions
        .filter((position) =>
          matchesJobSearch(position, {
            query,
            location,
            contractType,
            status,
          }),
        )
        .map((position) => this.toJobOffer(position, applicationCounts, companies)),
    ),
  );

  isLoading = true;
  isSubmitting = false;
  error: string | null = null;
  apiError: string | null = null;
  editorMode: EditorMode | null = null;
  selectedOffer: JobOfferVm | null = null;

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.jobsApi
      .loadWorkspace()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ positions, applicationCounts, companies }) => {
          this.positionsSubject.next(positions);
          this.applicationCountsSubject.next(applicationCounts);
          this.companiesSubject.next(companies);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.error = 'Unable to load job offers.';
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  openCreate(): void {
    const firstCompany = this.companiesSubject.value[0] ?? null;
    this.selectedOffer = null;
    this.editorMode = 'create';
    this.apiError = null;
    this.editorForm.reset({
      company: firstCompany?.id ?? null,
      title: '',
      department: '',
      contract_type: '',
      location: '',
      description: '',
      salary: null,
      is_active: true,
    });
    this.cdr.markForCheck();
  }

  openEdit(offer: JobOfferVm): void {
    this.selectedOffer = offer;
    this.editorMode = 'edit';
    this.apiError = null;
    this.editorForm.reset({
      company: offer.dto.company,
      title: offer.dto.title,
      department: offer.dto.department,
      contract_type: offer.dto.contract_type,
      location: offer.dto.location ?? '',
      description: offer.dto.description ?? '',
      salary: offer.dto.salary ?? null,
      is_active: offer.dto.is_active ?? true,
    });
    this.cdr.markForCheck();
  }

  closeEditor(): void {
    this.editorMode = null;
    this.selectedOffer = null;
    this.apiError = null;
    this.cdr.markForCheck();
  }

  saveJob(): void {
    this.apiError = null;

    if (this.editorForm.invalid) {
      this.editorForm.markAllAsTouched();
      return;
    }

    const payload = this.toPayload();
    const request =
      this.editorMode === 'edit' && this.selectedOffer
        ? this.jobsApi.updatePosition(this.selectedOffer.id, payload)
        : this.jobsApi.createPosition(payload);

    this.isSubmitting = true;
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (position) => {
        this.upsertPosition(position);
        this.isSubmitting = false;
        this.closeEditor();
      },
      error: (err: unknown) => {
        this.apiError = this.toErrorMessage(err);
        this.isSubmitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  archiveJob(offer: JobOfferVm): void {
    this.isSubmitting = true;
    this.apiError = null;

    this.jobsApi
      .archivePosition(offer.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (position) => {
          this.upsertPosition(position);
          this.isSubmitting = false;
          if (this.selectedOffer?.id === offer.id) {
            this.closeEditor();
          }
          this.cdr.markForCheck();
        },
        error: (err: unknown) => {
          this.apiError = this.toErrorMessage(err);
          this.isSubmitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  trackJob(_index: number, offer: JobOfferVm): number {
    return offer.id;
  }

  private toJobOffer(
    position: PositionDto,
    applicationCounts: Record<number, number>,
    companies: CompanyDto[],
  ): JobOfferVm {
    const applicantsCount = applicationCounts[position.id] ?? 0;
    const company = companies.find((item) => item.id === position.company);

    return {
      id: position.id,
      title: position.title,
      companyName: company?.name ?? null,
      location: position.location?.trim() || null,
      contractType: position.contract_type,
      department: position.department,
      applicants: `${applicantsCount} Applicants`,
      status: getJobStatus(position),
      dto: position,
    };
  }

  private toPayload(): PositionCreatePayload {
    const raw = this.editorForm.getRawValue();
    const salary =
      raw.salary === null || raw.salary === undefined || Number.isNaN(Number(raw.salary))
        ? null
        : Number(raw.salary);

    if (raw.company === null) {
      throw new Error('Company is required.');
    }

    return {
      company: raw.company,
      title: raw.title.trim(),
      department: raw.department.trim(),
      contract_type: raw.contract_type.trim(),
      location: raw.location.trim() || undefined,
      description: raw.description.trim() || undefined,
      salary,
      is_active: raw.is_active,
    };
  }

  private upsertPosition(position: PositionDto): void {
    const current = this.positionsSubject.value;
    const next = current.some((item) => item.id === position.id)
      ? current.map((item) => (item.id === position.id ? position : item))
      : [position, ...current];

    this.positionsSubject.next(next);
  }

  private toErrorMessage(err: unknown): string {
    if (typeof err === 'object' && err !== null && 'error' in err) {
      const body = (err as { error?: unknown }).error;
      if (typeof body === 'object' && body !== null && 'detail' in body) {
        return String((body as { detail: unknown }).detail);
      }

      if (typeof body === 'object' && body !== null) {
        return Object.entries(body)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : String(value)}`)
          .join(' | ');
      }
    }

    return 'Unable to save this job offer.';
  }

  private buildOptions(
    rawValues: (string | undefined | null)[],
    allLabel: string,
  ): FilterOption[] {
    const values = Array.from(
      new Set(
        rawValues
          .map((value) => value?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((first, second) => first.localeCompare(second));

    return [
      { label: allLabel, value: 'all' },
      ...values.map((value) => ({
        label: value,
        value: value.toLowerCase(),
      })),
    ];
  }

  private toTitleCase(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
