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
    <div class="select-none">
      <div class="inline-flex items-center gap-3">
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
          class="relative h-6 w-11 rounded-full transition
                 disabled:opacity-60 disabled:cursor-not-allowed"
          [class.bg-emerald-600]="value()"
          [class.bg-slate-700]="!value()"
        >
          <span
            class="absolute top-0.5 h-5 w-5 rounded-full bg-white transition"
            [class.left-0.5]="!value()"
            [class.left-[22px]]="value()"
          ></span>
        </button>

        @if (label) {
          <span class="text-sm text-slate-200" [id]="labelId">{{ label }}</span>
        }

        @if (hint) {
          <span class="text-xs text-slate-500" [id]="descId">{{ hint }}</span>
        }
      </div>

      @if (error) {
        <p class="mt-1 text-xs text-red-300" [id]="descId">{{ error }}</p>
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
