import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BehaviorSubject, catchError, map, of, switchMap, tap } from 'rxjs';

import {PageShellComponent} from '@layout/page-shell/page-shell.component'
import { PositionFormComponent } from 'src/app/features/positions/components/position-form/position-form.component';
import { PositionFormService } from '@features/positions/services/positions-form.service';
import type { PositionFormGroup } from '@features/positions/services/positions-form.service';
import { PositionsApiService, PositionCreatePayload, PositionDto } from '@features/positions/services/positions-api.service';

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; positionId: number; dto: PositionDto };

@Component({
  standalone: true,
  selector: 'app-position-edit-page',
  imports: [CommonModule, RouterModule, PageShellComponent, PositionFormComponent],
  templateUrl: './position-edit.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionEditPage {
  readonly form: PositionFormGroup;

  isSubmitting = false;
  apiError: string | null = null;
  fieldErrors: Record<string, string[]> = {};

  private readonly reload$ = new BehaviorSubject<void>(undefined);

  readonly state$ = this.reload$.pipe(
    map(() => this.route.snapshot.paramMap.get('id')),
    map((idParam) => {
      const id = Number(idParam);
      return !idParam || Number.isNaN(id) ? null : id;
    }),
    switchMap((id) => {
      if (!id) {
        return of<PageState>({ status: 'error', message: 'Invalid position id.' });
      }

      return this.api.getById(id).pipe(
        tap((dto) => this.formService.patchFromDto(this.form, dto)),
        map((dto) => ({ status: 'ready', positionId: id, dto } as PageState)),
        catchError(() => of<PageState>({ status: 'error', message: 'Unable to load this position.' }))
      );
    }),
    // start with loading automatically
    // (BehaviorSubject emits immediately so this is fine)
  );

  constructor(
    private readonly formService: PositionFormService,
    private readonly api: PositionsApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.form = this.formService.build();
  }

  submit(positionId: number): void {
    this.apiError = null;
    this.fieldErrors = {};

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const payload: PositionCreatePayload = this.formService.toPayload(this.form);

    this.api.patch(positionId, payload).subscribe({
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
    this.apiError = 'Unable to save changes.';
  }
}
