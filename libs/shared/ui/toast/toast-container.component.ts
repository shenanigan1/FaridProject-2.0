/**
 * ----------------------------------------------------------------------------
 * UiToastContainerComponent
 * ----------------------------------------------------------------------------
 * Render the toast queue. Place once near the app root.
 * Layer: shared/ui
 * ----------------------------------------------------------------------------
 *  Mount Once :
 *  <ui-toast-container></ui-toast-container>
 *
 * Usage :
 *  constructor(private readonly toast: ToastService) {}
 *     save(): void {
 *      this.toast.success('Saved successfully');
 *     }
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';
import { UiToast } from './toast.models';

@Component({
  standalone: true,
  selector: 'app-ui-toast-container',
  imports: [CommonModule],
  templateUrl: './toast-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiToastContainerComponent {
  readonly toast = inject(ToastService);

  trackById(_: number, t: UiToast): string {
    return t.id;
  }

  classes(t: UiToast): string {
    const base = 'pointer-events-auto w-80 rounded-2xl border p-4 text-sm shadow-xl';
    switch (t.tone) {
      case 'success':
        return `${base} border-emerald-500/25 bg-emerald-950 text-emerald-100`;
      case 'warning':
        return `${base} border-amber-500/25 bg-amber-950 text-amber-100`;
      case 'info':
        return `${base} border-blue-500/25 bg-blue-950 text-blue-100`;
      default:
        return `${base} border-red-500/25 bg-red-950 text-red-100`;
    }
  }
}
