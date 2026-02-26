import { Injectable } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
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
  constructor(private readonly fb: FormBuilder) {}

  build(): PositionFormGroup {
    const nn = this.fb.nonNullable;

    return new FormGroup({
      company: new FormControl<number | null>(null, { validators: [Validators.required], nonNullable: false }),
      title: nn.control('', [Validators.required, Validators.maxLength(255)]),
      description: nn.control(''),
      department: nn.control('', [Validators.required, Validators.maxLength(255)]),
      contract_type: nn.control('', [Validators.required, Validators.maxLength(100)]),
      location: nn.control(''),
      salary: new FormControl<number | null>(null, { nonNullable: false }),
      is_active: nn.control(true),
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
    return {
      company: raw.company as number,
      title: raw.title.trim(),
      description: raw.description.trim(),
      department: raw.department.trim(),
      contract_type: raw.contract_type.trim(),
      location: raw.location.trim(),
      salary: raw.salary === null ? null : Number(raw.salary),
      is_active: raw.is_active,
    };
  }
}
