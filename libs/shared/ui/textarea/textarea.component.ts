/**
 * ----------------------------------------------------------------------------
 * UiTextareaComponent (CVA)
 * ----------------------------------------------------------------------------
 * Reusable textarea with error + hint.
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 */
import { ChangeDetectionStrategy, Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-ui-textarea',
  imports: [CommonModule],
  templateUrl: './textarea.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiTextareaComponent), multi: true },
  ],
})
export class UiTextareaComponent implements ControlValueAccessor {
  private static nextId = 0;

  @Input() label: string | null = null;
  @Input() hint: string | null = null;
  @Input() error: string | null = null;
  @Input() textareaId = '';

  @Input() placeholder = '';
  @Input() rows = 4;

  readonly generatedId = `ff-textarea-${++UiTextareaComponent.nextId}`;
  readonly value = signal('');
  readonly disabled = signal(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (v: string) => void = (_v: string) => void 0;
  private onTouched: () => void = () => void 0;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  handleInput(e: Event): void {
    const v = (e.target as HTMLTextAreaElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  blur(): void {
    this.onTouched();
  }


  get textareaClasses(): string {
    return ['ff-input', 'mt-1', 'min-h-24', this.error ? 'ff-input-error' : ''].filter(Boolean).join(' ');
  }

  get controlId(): string {
    return this.textareaId || this.generatedId;
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
