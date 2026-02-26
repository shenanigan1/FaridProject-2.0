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
  selector: 'ui-toggle',
  imports: [CommonModule],
  template: `
    <label class="inline-flex items-center gap-3 select-none">
      <button
        type="button"
        role="switch"
        [attr.aria-checked]="value()"
        [disabled]="disabled()"
        (click)="toggle()"
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

      <span *ngIf="label" class="text-sm text-slate-200">{{ label }}</span>
      <span *ngIf="hint" class="text-xs text-slate-500">{{ hint }}</span>
    </label>

    <p *ngIf="error" class="mt-1 text-xs text-red-300">{{ error }}</p>
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

  private onChange: (v: boolean) => void = () => {};
  private onTouched: () => void = () => {};

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
}
