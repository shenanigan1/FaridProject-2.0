import { LucideDynamicIcon } from '@lucide/angular';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  forwardRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-ui-password-input',
  standalone: true,
  imports: [CommonModule, LucideDynamicIcon],
  templateUrl: './password-input.component.html',
  styleUrl: './password-input.component.scss',
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
  @Input() inputId = '';
  @Input() placeholder = '';
  @Input() error: string | null = null;
  @Input() icon: any = null;

  private readonly cdr = inject(ChangeDetectorRef);

  readonly value = signal('');
  readonly disabled = signal(false);
  readonly show = signal(false);

  private onChange: (v: string) => void = (_v: string) => void 0;
  private onTouched: () => void = () => void 0;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
    this.cdr.markForCheck();
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
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
    this.cdr.markForCheck();
  }

  get inputClasses(): string {
    return [
      'ff-password-input',
      this.icon ? 'ff-password-input--with-icon' : '',
      this.error ? 'ff-password-input--error' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
}