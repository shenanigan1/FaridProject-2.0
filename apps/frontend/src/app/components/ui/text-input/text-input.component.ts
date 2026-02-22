import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: TextInputComponent,
      multi: true,
    },
  ],
})
export class TextInputComponent implements ControlValueAccessor {
  @Input({ required: true }) label!: string;
  @Input() placeholder = '';
  @Input() type: 'text' | 'email' = 'text';
  @Input() error: string | null = null;

  value = '';
  disabled = false;

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput(event: Event): void {
  const value = (event.target as HTMLInputElement).value;
  this.onChange(value);
}
}
