/**
 * ----------------------------------------------------------------------------
 * UiRadioGroupComponent (CVA)
 * ----------------------------------------------------------------------------
 * Radio group control for string keys (e.g., difficulty, format).
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */
import { ChangeDetectionStrategy, Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface UiRadioOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-ui-radio-group',
  imports: [CommonModule],
  template: `
    <div class="block" role="radiogroup" [attr.aria-invalid]="error ? 'true' : null">

      @if (label) {
        <div class="mb-2 text-sm font-medium text-slate-300">{{ label }}</div>
      }

      <div class="flex flex-wrap gap-2">
        @for (opt of options; track opt.value) {
          <label
            class="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition select-none
                   border-slate-800 bg-slate-900/40 text-slate-200
                   hover:bg-slate-800/50"
            [class.opacity-60]="opt.disabled || disabled()"
          >
            <input
              type="radio"
              class="accent-blue-500"
              [disabled]="disabled() || !!opt.disabled"
              [checked]="value() === opt.value"
              [attr.aria-invalid]="error ? 'true' : null"
              (change)="select(opt.value)"
              (blur)="handleBlur()"
            />
            {{ opt.label }}
          </label>
        }
      </div>

      @if (error) {
        <p class="mt-1 text-xs text-red-300">{{ error }}</p>
      } @else if (hint) {
        <p class="mt-1 text-xs text-slate-500">{{ hint }}</p>
      }

    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiRadioGroupComponent), multi: true },
  ],
})
export class UiRadioGroupComponent<T extends string = string> implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() hint: string | null = null;
  @Input() error: string | null = null;

  @Input() options: UiRadioOption<T>[] = [];

  readonly value = signal<T | null>(null);
  readonly disabled = signal(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (v: T | null) => void = (_v: T | null) => void 0;
  private onTouched: () => void = () => void 0;

  writeValue(value: T | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (v: T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  select(v: T): void {
    if (this.disabled()) return;
    this.value.set(v);
    this.onChange(v);
    this.onTouched();
  }

  handleBlur(): void {
    this.onTouched();
  }
}
