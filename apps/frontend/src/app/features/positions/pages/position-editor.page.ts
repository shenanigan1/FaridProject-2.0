import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap, tap } from 'rxjs';

import { PageShellComponent } from '@layout/page-shell/page-shell.component';
import { PositionFormComponent } from '@features/positions/components/position-form/position-form.component';
import { PositionFormService, PositionFormGroup } from '@features/positions/services/positions-form.service';
import {
  PositionCreatePayload,
  PositionDto,
  PositionsApiService,
  TemplateOptionDto,
} from '@features/positions/services/positions-api.service';

import { UiLinkButtonComponent } from '@lib-ui/link-button/ui-link-button.component';
import { UiCardComponent } from '@lib-ui/card/card.component';

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
  private readonly destroyRef = inject(DestroyRef);

  readonly form: PositionFormGroup = this.formService.build();

  readonly isSubmitting = signal(false);
  readonly apiError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string[]>>({});
  readonly availableTemplates = signal<TemplateOptionDto[]>([]);
  readonly selectedTemplateIds = signal<number[]>([]);
  readonly managerByTemplate = signal<Partial<Record<number, string>>>({});
  readonly templatesMessage = signal<string | null>(null);
  readonly templatesSaving = signal(false);

  // ✅ Observable id
  private readonly positionId$ = this.route.paramMap.pipe(
    map((pm) => pm.get('id')),
    map((idParam) => {
      if (!idParam) return null;
      const id = Number(idParam);
      return Number.isNaN(id) ? null : id;
    }),
  );

  // ✅ Signal id
  private readonly positionId = toSignal(this.positionId$, { initialValue: null });

  readonly mode = computed<Mode>(() => (this.positionId() !== null ? 'edit' : 'create'));

  readonly shellTitle = computed(() =>
    this.mode() === 'edit' ? 'Manage Position' : 'Add Position',
  );

  readonly shellSubtitle = computed(() =>
    this.mode() === 'edit' ? 'Edit job offer details' : 'Create a new job offer',
  );

  // ✅ Observable state (from positionId$)
  private readonly state$ = this.positionId$.pipe(
    switchMap((id) => {
      // edit
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

      // create
      return of<PageState>({ status: 'ready-create' });
    }),
    startWith<PageState>({ status: 'loading' }),
  );

  // ✅ Signal state
  readonly state = toSignal(this.state$, { initialValue: { status: 'loading' } as const });

  constructor() {
    this.loadTemplateConfiguration();
  }

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

  toggleTemplate(templateId: number): void {
    const current = this.selectedTemplateIds();
    if (current.includes(templateId)) {
      this.selectedTemplateIds.set(current.filter((id) => id !== templateId));
      return;
    }
    this.selectedTemplateIds.set([...current, templateId]);
  }

  updateTemplateManager(templateId: number, rawValue: string): void {
    this.managerByTemplate.set({
      ...this.managerByTemplate(),
      [templateId]: rawValue.trim(),
    });
  }

  onTemplateManagerInput(templateId: number, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    this.updateTemplateManager(templateId, target.value);
  }

  saveTemplateAssignments(): void {
    const id = this.positionId();
    if (id === null) {
      this.templatesMessage.set('Save the position first before assigning templates.');
      return;
    }

    this.templatesSaving.set(true);
    this.templatesMessage.set(null);
    const managerByTemplate = this.managerByTemplate();
    const payload = this.selectedTemplateIds().map((templateId, index) => {
      const managerRaw = managerByTemplate[templateId] ?? '';
      const managerId = Number(managerRaw);
      return {
        template_id: templateId,
        manager_id:
          managerRaw.length > 0 && Number.isInteger(managerId) && managerId > 0
            ? managerId
            : null,
        order: index,
      };
    });

    this.api
      .setPositionTemplateAssignments(id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.templatesSaving.set(false);
          this.templatesMessage.set('Position test templates saved.');
        },
        error: () => {
          this.templatesSaving.set(false);
          this.templatesMessage.set(
            'Unable to save template assignments. Check manager IDs and try again.',
          );
        },
      });
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

  private loadTemplateConfiguration(): void {
    this.api
      .listTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (templates) => {
          this.availableTemplates.set(templates);

          const id = this.positionId();
          if (id === null) return;

          this.api
            .getPositionTemplateAssignments(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: (assignments) => {
                this.selectedTemplateIds.set(assignments.map((item) => item.template));
                this.managerByTemplate.set(
                  assignments.reduce<Record<number, string>>((acc, item) => {
                    acc[item.template] = item.manager_id ? String(item.manager_id) : '';
                    return acc;
                  }, {}),
                );
              },
            });
        },
      });
  }
}
