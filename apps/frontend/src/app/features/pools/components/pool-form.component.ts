import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { UiAlertComponent } from '@shared/ui/alert/alert.component';
import { UiCardComponent } from '@shared/ui/card/card.component';
import { UiTextInputComponent } from '@shared/ui/text-input/text-input.component';
import { UiTextareaComponent } from '@shared/ui/textarea/textarea.component';
import { UiButtonPrimaryComponent } from '@shared/ui/button-primary/button-primary.component';

export type PoolFormMode = 'create' | 'edit' | 'view';

export type PoolFormGroup = FormGroup<{
  name: FormControl<string>;
  code: FormControl<string>;
  description: FormControl<string | null>;
}>;

@Component({
  selector: 'app-pool-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiAlertComponent,
    UiCardComponent,
    UiTextInputComponent,
    UiTextareaComponent,
    UiButtonPrimaryComponent,
  ],
  templateUrl: './pool-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolFormComponent {
  @Input({ required: true }) mode!: PoolFormMode;
  @Input({ required: true }) form!: PoolFormGroup;

  @Input() isLoading = false;
  @Input() apiError: string | null = null;

  /** Mostly useful in view/edit */
  @Input() showNormalizeHint = true;

  @Output() normalize = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();
  @Output() cancelForm = new EventEmitter<void>();

  get isView(): boolean {
    return this.mode === 'view';
  }
}
