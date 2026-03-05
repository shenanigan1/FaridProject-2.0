import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap, tap } from 'rxjs';

import { PageShellComponent } from '@layout/page-shell/page-shell.component';
import { PositionFormComponent } from '@features/positions/components/position-form/position-form.component';
import {
  PositionFormService,
  PositionFormGroup,
} from '@features/positions/services/positions-form.service';
import {
  PositionsApiService,
  PositionCreatePayload,
  PositionDto,
} from '@features/positions/services/positions-api.service';

import { UiLinkButtonComponent } from '@shared/ui/link-button/ui-link-button.component';
import { UiCardComponent } from '@shared/ui/card/card.component';

type Mode = 'create' | 'edit';

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready-create' }
  | { status: 'ready-edit'; positionId: number; dto: PositionDto };

type ApiErrorBody = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Component({
  standalone: true,
  selector: 'app-position-editor-page',
  imports: [
    CommonModule,
    PageShellComponent,
    PositionFormComponent,
    UiLinkButtonComponent,
    UiCardComponent,
  ],
  templateUrl: './position-editor.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PositionEditorPage {
  private readonly formService = inject(PositionFormService);
  private readonly api = inject(PositionsApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // ✅ IMPORTANT: create DestroyRef in injection context (field initializer)
  private readonly destroyRef = inject(DestroyRef);

  readonly form: PositionFormGroup = this.formService.build();

  readonly isSubmitting = signal(false);
  readonly apiError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string[]>>({});

  private readonly positionId$ = this.route.paramMap.pipe(
    map((pm) => pm.get('id')),
    map((idParam) => {
      if (!idParam) return null;
      const id = Number(idParam);
      return Number.isNaN(id) ? null : id;
    }),
  );

  private readonly positionId = toSignal(this.positionId$, { initialValue: null });

  readonly mode = computed<Mode>(() =>
    this.positionId() !== null ? 'edit' : 'create',
  );

  readonly shellTitle = computed(() =>
    this.mode() === 'edit' ? 'Manage Position' : 'Add Position',
  );

  readonly shellSubtitle = computed(() =>
    this.mode() === 'edit' ? 'Edit job offer details' : 'Create a new job offer',
  );

  private readonly state$ = this.positionId$.pipe(
    switchMap((id) => {
      if (id !== null) {
        return this.api.getById(id).pipe(
          tap((dto) => this.formService.patchFromDto(this.form, dto)),
          map(
            (dto): PageState => ({
              status: 'ready-edit',
              positionId: id,
              dto,
            }),
          ),
          catchError(() =>
            of<PageState>({
              status: 'error',
              message: 'Unable to load this position.',
            }),
          ),
        );
      }

      return of<PageState>({ status: 'ready-create' });
    }),
    startWith<PageState>({ status: 'loading' }),
  );

  readonly state = toSignal(this.state$, {
    initialValue: { status: 'loading' } as const,
  });

  submit(): void {
    this.apiError.set(null);
    this.fieldErrors.set({});

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const payload: PositionCreatePayload = this.formService.toPayload(this.form);
    const id = this.positionId();
    const req$ = id !== null ? this.api.patch(id, payload) : this.api.create(payload);

    // ✅ now safe: takeUntilDestroyed has an explicit DestroyRef
    req$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        void this.router.navigateByUrl('/positions');
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.handleApiError(
          err,
          id !== null ? 'Unable to save changes.' : 'Unable to create position.',
        );
      },
    });
  }

  cancel(): void {
    void this.router.navigateByUrl('/positions');
  }

  private handleApiError(err: unknown, fallback: string): void {
    const httpLike = isRecord(err) ? err : null;
    const body = httpLike && 'error' in httpLike ? httpLike['error'] : null;
    const data: unknown = body;

    if (isRecord(data)) {
      const detail = data['detail'];
      if (typeof detail === 'string') {
        this.apiError.set(detail);
        return;
      }

      const mapped: Record<string, string[]> = Object.fromEntries(
        Object.entries(data as ApiErrorBody).map(([k, v]) => [
          k,
          Array.isArray(v) ? v.map(String) : [String(v)],
        ]),
      );

      this.fieldErrors.set(mapped);
      return;
    }

    this.apiError.set(fallback);
  }
}
