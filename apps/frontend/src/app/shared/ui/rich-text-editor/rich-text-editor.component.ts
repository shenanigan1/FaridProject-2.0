import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ui-rich-text-editor',
  standalone: true,
  imports: [CommonModule, QuillModule, FormsModule],
  templateUrl: './rich-text-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiRichTextEditorComponent),
      multi: true,
    },
  ],
})
export class UiRichTextEditorComponent implements ControlValueAccessor {
  @Input() placeholder = 'Write here...';
  @Input() disabled = false;

  value = '';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (v: string) => void = (_v: string) => void 0;
  private onTouched: () => void = () => void 0;

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleChange(value: string): void {
    this.value = value;
    this.onChange(value);
  }
}
