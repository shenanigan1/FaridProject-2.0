import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { JobOfferFilters } from '@jobs/models/job-offer.model';

type JobFiltersForm = FormGroup<{
  search: FormControl<string>;
  location: FormControl<string>;
  employmentType: FormControl<string>;
  priority: FormControl<string>;
}>;

@Component({
  selector: 'app-job-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './job-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobFiltersComponent {
  @Input({ required: true }) set filters(value: JobOfferFilters) {
    this.form.patchValue(
      {
        search: value.search,
        location: value.location,
        employmentType: value.employmentType,
        priority: value.priority,
      },
      { emitEvent: false },
    );
  }

  @Output() readonly filtersChange = new EventEmitter<
    Omit<JobOfferFilters, 'page'>
  >();

  @Output() readonly resetFilters = new EventEmitter<void>();

  readonly form: JobFiltersForm = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    location: new FormControl('', { nonNullable: true }),
    employmentType: new FormControl('', { nonNullable: true }),
    priority: new FormControl('', { nonNullable: true }),
  });

  submit(): void {
    this.filtersChange.emit(this.form.getRawValue());
  }

  reset(): void {
    this.form.reset(
      {
        search: '',
        location: '',
        employmentType: '',
        priority: '',
      },
      { emitEvent: false },
    );

    this.resetFilters.emit();
  }
}
