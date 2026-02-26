/**
 * ----------------------------------------------------------------------------
 * UiSelectComponent (CVA)
 * ----------------------------------------------------------------------------
 * Reusable select/dropdown with error + hint display.
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */
import { ChangeDetectionStrategy, Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type UiSelectOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

@Component({
  standalone: true,
  selector: 'ui-select',
  imports: [CommonModule],
  templateUrl: './select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiSelectComponent), multi: true },
  ],
})
export class UiSelectComponent<T extends string = string> implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() hint: string | null = null;
  @Input() error: string | null = null;

  @Input() placeholder: string = 'Select...';
  @Input() options: UiSelectOption<T>[] = [];

  readonly value = signal<T | null>(null);
  readonly disabled = signal(false);

  private onChange: (v: T | null) => void = () => {};
  private onTouched: () => void = () => {};

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

  handleChange(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    const next = (v === '' ? null : (v as T));
    this.value.set(next);
    this.onChange(next);
  }

  blur(): void {
    this.onTouched();
  }
}
