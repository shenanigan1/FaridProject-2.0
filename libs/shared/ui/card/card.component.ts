import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

type UiCardVariant = 'default' | 'elevated' | 'form' | 'data' | 'question';
type UiCardTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'orange';

@Component({
  standalone: true,
  selector: 'app-ui-card',
  template: `
    <div [class]="classes">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiCardComponent {
  @Input() variant: UiCardVariant = 'form';
  @Input() tone: UiCardTone = 'neutral';

  get classes(): string {
    const variantClass: Record<UiCardVariant, string> = {
      default: 'ff-card',
      elevated: 'ff-card-elevated',
      form: 'ff-card',
      data: 'ff-data-card',
      question: 'ff-question-card',
    };

    const toneClass: Record<UiCardTone, string> = {
      neutral: '',
      primary: 'ff-accent-marker',
      success: 'ff-accent-marker ff-accent-success',
      warning: 'ff-accent-marker ff-accent-warning',
      danger: 'ff-accent-marker ff-accent-danger',
      info: 'ff-accent-marker ff-accent-info',
      orange: 'ff-accent-marker ff-accent-orange',
    };

    return [variantClass[this.variant], toneClass[this.tone], this.variant === 'form' ? 'p-5' : '']
      .filter(Boolean)
      .join(' ');
  }
}
