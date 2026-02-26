import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { PageShellComponent } from '@layout/page-shell/page-shell.component';
import { PositionFormComponent } from 'src/app/features/positions/components/position-form/position-form.component';
import { PositionFormService, PositionFormGroup } from '@features/positions/services/positions-form.service';
import { PositionsApiService, PositionCreatePayload } from '@features/positions/services/positions-api.service';

@Component({
  standalone: true,
  selector: 'app-position-create-page',
  imports: [CommonModule, RouterModule, PageShellComponent, PositionFormComponent],
  templateUrl: './position-create.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionCreatePage {
  readonly form: PositionFormGroup;

  isSubmitting = false;
  apiError: string | null = null;
  fieldErrors: Record<string, string[]> = {};

  constructor(
    private readonly formService: PositionFormService,
    private readonly api: PositionsApiService,
    private readonly router: Router
  ) {
    this.form = this.formService.build();
  }

  submit(): void {
    this.apiError = null;
    this.fieldErrors = {};

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload: PositionCreatePayload = this.formService.toPayload(this.form);

    this.api.create(payload).subscribe({
      next: async () => {
        this.isSubmitting = false;
        await this.router.navigateByUrl('/positions');
      },
      error: (err) => {
        this.isSubmitting = false;
        this.handleApiError(err);
      },
    });
  }

  cancel(): void {
    void this.router.navigateByUrl('/positions');
  }

  private handleApiError(err: unknown): void {
    const data: any = (err as any)?.error;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (typeof data.detail === 'string') {
        this.apiError = data.detail;
        return;
      }
      this.fieldErrors = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.map(String) : [String(v)]])
      );
      return;
    }
    this.apiError = 'Unable to create position.';
  }
}
