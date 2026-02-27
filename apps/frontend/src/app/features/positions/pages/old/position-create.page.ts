import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PageShellComponent } from '@layout/page-shell/page-shell.component';
import { PositionFormComponent } from '@features/positions/components/position-form/position-form.component';
import { PositionFormService, PositionFormGroup } from '@features/positions/services/positions-form.service';
import { PositionsApiService, PositionCreatePayload } from '@features/positions/services/positions-api.service';

import { UiLinkButtonComponent } from '@shared/ui/link-button/ui-link-button.component';

@Component({
  standalone: true,
  selector: 'app-position-create-page',
  imports: [CommonModule, PageShellComponent, PositionFormComponent, UiLinkButtonComponent],
  templateUrl: './position-create.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionCreatePage {
  private readonly formService = inject(PositionFormService);
  private readonly api = inject(PositionsApiService);
  private readonly router = inject(Router);

  readonly form: PositionFormGroup = this.formService.build();

  readonly isSubmitting = signal(false);
  readonly apiError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string[]>>({});

  submit(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const payload: PositionCreatePayload = this.formService.toPayload(this.form);

    this.api
      .create(payload)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          void this.router.navigateByUrl('/positions');
        },
        error: (err: unknown) => {
          this.isSubmitting.set(false);
          this.handleApiError(err);
        },
      });
  }

  cancel(): void {
    void this.router.navigateByUrl('/positions');
  }

  private handleApiError(err: unknown): void {
    const data = (err as any)?.error;

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (typeof (data as any).detail === 'string') {
        this.apiError.set((data as any).detail);
        return;
      }

      const mapped: Record<string, string[]> = Object.fromEntries(
        Object.entries(data as Record<string, unknown>).map(([k, v]) => [
          k,
          Array.isArray(v) ? v.map(String) : [String(v)],
        ])
      );

      this.fieldErrors.set(mapped);
      return;
    }

    this.apiError.set('Unable to create position.');
  }
}
