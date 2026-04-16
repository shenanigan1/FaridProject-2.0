/**
 * ----------------------------------------------------------------------------
 * UiToggleComponent (CVA)
 * ----------------------------------------------------------------------------
 * Switch/toggle input for boolean values.
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */
import { ChangeDetectionStrategy, Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-ui-toggle',
  imports: [CommonModule],
  template: `
    <div class="ff-field select-none">
      <div class="mt-1 inline-flex items-center gap-3">
        <button
          type="button"
          role="switch"
          [attr.aria-checked]="value()"
          [attr.aria-labelledby]="label ? labelId : null"
          [attr.aria-describedby]="(hint || error) ? descId : null"
          [attr.aria-invalid]="error ? 'true' : null"
          [disabled]="disabled()"
          (click)="toggle()"
          (blur)="handleBlur()"
          class="ff-toggle-track"
          [class.bg-primary-500]="value()"
          [class.bg-surface-2]="!value()"
        >
          <span
            class="ff-toggle-thumb"
            [class.left-0.5]="!value()"
            [class.left-[22px]]="value()"
          ></span>
        </button>

        @if (label) {
          <span class="ff-field-label" [id]="labelId">{{ label }}</span>
        }

        @if (hint) {
          <span class="ff-field-hint" [id]="descId">{{ hint }}</span>
        }
      </div>

      @if (error) {
        <p class="ff-field-error" [id]="descId">{{ error }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiToggleComponent), multi: true },
  ],
})
export class UiToggleComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() hint: string | null = null;
  @Input() error: string | null = null;

  readonly value = signal(false);
  readonly disabled = signal(false);

  // ids for aria-* links
  readonly labelId = `ui-toggle-label-${Math.random().toString(16).slice(2)}`;
  readonly descId = `ui-toggle-desc-${Math.random().toString(16).slice(2)}`;

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

  toggle(): void {
    if (this.disabled()) return;
    const next = !this.value();
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }

  handleBlur(): void {
    this.onTouched();
  }
}
