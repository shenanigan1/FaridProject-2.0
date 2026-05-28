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

export interface UiSelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

@Component({
  standalone: true,
  selector: 'app-ui-select',
  imports: [CommonModule],
  templateUrl: './select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiSelectComponent), multi: true },
  ],
})
export class UiSelectComponent<T extends string = string> implements ControlValueAccessor {
  private static nextId = 0;

  @Input() label: string | null = null;
  @Input() hint: string | null = null;
  @Input() error: string | null = null;
  @Input() selectId = '';

  @Input() placeholder = 'Select...';
  @Input() options: UiSelectOption<T>[] = [];

  readonly generatedId = `ff-select-${++UiSelectComponent.nextId}`;
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

  handleChange(e: Event): void {
    const v = (e.target as HTMLSelectElement).value;
    const next = (v === '' ? null : (v as T));
    this.value.set(next);
    this.onChange(next);
  }

  blur(): void {
    this.onTouched();
  }


  get selectClasses(): string {
    return ['ff-input', 'mt-1', this.error ? 'ff-input-error' : ''].filter(Boolean).join(' ');
  }

  get controlId(): string {
    return this.selectId || this.generatedId;
  }

  get errorId(): string {
    return `${this.controlId}-error`;
  }

  get hintId(): string {
    return `${this.controlId}-hint`;
  }

  get describedBy(): string | null {
    if (this.error) {
      return this.errorId;
    }

    return this.hint ? this.hintId : null;
  }
}
