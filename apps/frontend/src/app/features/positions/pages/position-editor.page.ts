import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  | { status: 'ready'; positionId: number; dto: PositionDto };

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

  readonly form: PositionFormGroup = this.formService.build();

  readonly isSubmitting = signal(false);
  readonly apiError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string[]>>({});

  // if route has :id -> edit, otherwise create
  private readonly positionId = toSignal(
    this.route.paramMap.pipe(
      map((pm) => pm.get('id')),
      map((idParam) => {
        if (!idParam) return null;
        const id = Number(idParam);
        return Number.isNaN(id) ? null : id;
      }),
    ),
    { initialValue: null },
  );

  readonly shellTitle = computed(() =>
    this.mode() === 'edit' ? 'Manage Position' : 'Add Position',
  );
  readonly shellSubtitle = computed(() =>
    this.mode() === 'edit' ? 'Edit job offer details' : 'Create a new job offer',
  );

  readonly mode = signal<Mode>('create'); // ou computed selon route

  readonly state = toSignal(
    this.route.paramMap.pipe(
      map((pm) => pm.get('id')),
      map((idParam) => {
        const id = Number(idParam);
        return !idParam || Number.isNaN(id) ? null : id;
      }),
      switchMap((id) => {
        // edit
        if (id) {
          this.mode.set('edit');
          return this.api.getById(id).pipe(
            tap((dto) => this.formService.patchFromDto(this.form, dto)),
            map((dto) => ({ status: 'ready', positionId: id, dto }) as const),
            catchError(() =>
              of({ status: 'error', message: 'Unable to load this position.' } as const),
            ),
          );
        }

        // create
        this.mode.set('create');
        return of({ status: 'ready', positionId: 0, dto: null as any } as const); // ou un ready sans dto
      }),
      startWith({ status: 'loading' } as const),
    ),
  );

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
    const req$ = id ? this.api.patch(id, payload) : this.api.create(payload);

    req$.pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        void this.router.navigateByUrl('/positions');
      },
      error: (err: unknown) => {
        this.isSubmitting.set(false);
        this.handleApiError(err, id ? 'Unable to save changes.' : 'Unable to create position.');
      },
    });
  }

  cancel(): void {
    void this.router.navigateByUrl('/positions');
  }

  private handleApiError(err: unknown, fallback: string): void {
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
        ]),
      );

      this.fieldErrors.set(mapped);
      return;
    }

    this.apiError.set(fallback);
  }
}
