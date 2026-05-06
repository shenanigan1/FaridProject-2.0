import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { PositionCreatePayload } from '@features/positions/services/positions-api.service';
import { PositionFormGroup } from '@features/positions/services/positions-form.service';

import { UiFormFieldComponent } from '@lib-ui/form-field/form-field.component';
import { UiAlertComponent } from '@lib-ui/alert/alert.component'

@Component({
  standalone: true,
  selector: 'app-position-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiFormFieldComponent,
    UiAlertComponent,
  ],
  templateUrl: './position-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionFormComponent {
  @Input({ required: true }) form!: PositionFormGroup;

  @Input() mode: 'create' | 'edit' = 'create';
  @Input() isLoading = false;
  @Input() isSubmitting = false;

  /** non-field error */
  @Input() apiError: string | null = null;

  /** DRF field errors: { field: ["msg"] } */
  @Input() fieldErrors: Record<string, string[]> = {};

  @Output() submitForm = new EventEmitter<void>();
  @Output() cancelForm = new EventEmitter<void>();

  backendError(field: keyof PositionCreatePayload): string | null {
    const errors = this.fieldErrors?.[String(field)];
    return errors?.length ? errors[0] : null;
  }

  onSubmit(): void {
    this.submitForm.emit();
  }
}
