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
  selector: 'ui-checkbox',
  imports: [CommonModule],
  template: `
    <label class="inline-flex items-start gap-3 select-none">
      <input
        type="checkbox"
        class="mt-0.5 h-4 w-4 accent-blue-500"
        [disabled]="disabled()"
        [checked]="value()"
        (change)="handleChange($event)"
        (blur)="blur()"
      />

      <div>
        <div *ngIf="label" class="text-sm text-slate-200">{{ label }}</div>
        <div *ngIf="hint" class="text-xs text-slate-500">{{ hint }}</div>
        <div *ngIf="error" class="text-xs text-red-300 mt-1">{{ error }}</div>
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

  handleChange(e: Event): void {
    const next = (e.target as HTMLInputElement).checked;
    this.value.set(next);
    this.onChange(next);
  }

  blur(): void {
    this.onTouched();
  }
}
