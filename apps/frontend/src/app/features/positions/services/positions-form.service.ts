import { Injectable, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';
import { PositionCreatePayload, PositionDto } from '@positions/services/positions-api.service';

export type PositionFormGroup = FormGroup<{
  company: FormControl<number | null>;
  title: FormControl<string>;
  description: FormControl<string>;
  department: FormControl<string>;
  contract_type: FormControl<string>;
  location: FormControl<string>;
  salary: FormControl<number | null>;
  is_active: FormControl<boolean>;
}>;

@Injectable({ providedIn: 'root' })
export class PositionFormService {
  private readonly fb = inject(NonNullableFormBuilder);

  build(): PositionFormGroup {
    return new FormGroup({
      company: new FormControl<number | null>(null, {
        nonNullable: false,
        validators: [Validators.required],
      }),

      title: this.fb.control('', [Validators.required, Validators.maxLength(255)]),

      // Important: description/location restent string (pas null) dans ton type
      description: this.fb.control(''),
      department: this.fb.control('', [Validators.required, Validators.maxLength(255)]),
      contract_type: this.fb.control('', [Validators.required, Validators.maxLength(100)]),
      location: this.fb.control(''),

      salary: new FormControl<number | null>(null, { nonNullable: false }),

      is_active: this.fb.control(true),
    });
  }

  patchFromDto(form: PositionFormGroup, dto: PositionDto): void {
    form.patchValue({
      company: dto.company ?? null,
      title: dto.title ?? '',
      description: dto.description ?? '',
      department: dto.department ?? '',
      contract_type: dto.contract_type ?? '',
      location: dto.location ?? '',
      salary: dto.salary ?? null,
      is_active: dto.is_active ?? true,
    });
  }

  toPayload(form: PositionFormGroup): PositionCreatePayload {
    const raw = form.getRawValue();

    // Si invalid, mieux vaut throw (ou laisser l'appelant gérer), mais ici on sécurise
    const company = raw.company;
    if (company === null) {
      // Normalement impossible si le form est validé avant submit
      throw new Error('Company is required.');
    }

    return {
      company,
      title: raw.title.trim(),
      description: raw.description.trim() || undefined,
      department: raw.department.trim(),
      contract_type: raw.contract_type.trim(),
      location: raw.location.trim() || undefined,
      salary: raw.salary === null ? null : Number(raw.salary),
      is_active: raw.is_active,
    };
  }
}
