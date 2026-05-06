/**
 * ----------------------------------------------------------------------------
 * UiCheckboxComponent (CVA)
 * ----------------------------------------------------------------------------
 * Checkbox control (boolean) with label/hint/error.
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */
import { ChangeDetectionStrategy, Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-ui-checkbox',
  imports: [CommonModule],
  template: `
    <label class="inline-flex select-none items-start gap-3">
      <input
        type="checkbox"
        class="ff-checkbox"
        [disabled]="disabled()"
        [checked]="value()"
        [attr.aria-invalid]="error ? 'true' : null"
        (change)="handleChange($event)"
        (blur)="handleBlur()"
      />

      <div>
        @if (label) {
          <div class="ff-field-label">{{ label }}</div>
        }

        @if (hint) {
          <div class="ff-field-hint">{{ hint }}</div>
        }

        @if (error) {
          <div class="ff-field-error">{{ error }}</div>
        }
      </div>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiCheckboxComponent), multi: true },
  ],
})
export class UiCheckboxComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() hint: string | null = null;
  @Input() error: string | null = null;

  readonly value = signal(false);
  readonly disabled = signal(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (v: boolean) => void = (_v: boolean) => void 0;
  private onTouched: () => void = () => void 0;

  writeValue(value: boolean | null): void {
    this.value.set(!!value);
  }

  registerOnChange(fn: (v: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  handleChange(e: Event): void {
    const next = (e.target as HTMLInputElement).checked;
    this.value.set(next);
    this.onChange(next);
  }

  handleBlur(): void {
    this.onTouched();
  }
}
