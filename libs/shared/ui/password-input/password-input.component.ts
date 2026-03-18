import { ChangeDetectionStrategy, Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ui-password-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiPasswordInputComponent),
      multi: true,
    },
  ],
})
export class UiPasswordInputComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() placeholder = '';
  @Input() error: string | null = null;

  readonly value = signal('');
  readonly disabled = signal(false);
  readonly show = signal(false);


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

  handleInput(event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    this.value.set(v);
    this.onChange(v);
  }

  blur(): void {
    this.onTouched();
  }

  toggle(): void {
    this.show.set(!this.show());
  }
}
