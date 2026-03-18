// import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router } from '@angular/router';
// import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { catchError, map, of, startWith, switchMap, tap } from 'rxjs';

// import { PageShellComponent } from '@layout/page-shell/page-shell.component';
// import { PositionFormComponent } from '@features/positions/components/position-form/position-form.component';
// import { PositionFormService, PositionFormGroup } from '@features/positions/services/positions-form.service';
// import { PositionsApiService, PositionCreatePayload, PositionDto } from '@features/positions/services/positions-api.service';

// import { UiLinkButtonComponent } from '@lib-ui/link-button/ui-link-button.component';
// import { UiCardComponent } from '@lib-ui/card/card.component';

// type ApiErrorBody = Record<string, unknown>;

// function isRecord(value: unknown): value is Record<string, unknown> {
//   return typeof value === 'object' && value !== null && !Array.isArray(value);
// }

// type PageState =
//   | { status: 'loading' }
//   | { status: 'error'; message: string }
//   | { status: 'ready'; positionId: number; dto: PositionDto };

// @Component({
//   standalone: true,
//   selector: 'app-position-edit-page',
//   imports: [CommonModule, PageShellComponent, PositionFormComponent, UiLinkButtonComponent, UiCardComponent],
//   templateUrl: './position-edit.page.html',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class PositionEditPage {
//   private readonly formService = inject(PositionFormService);
//   private readonly api = inject(PositionsApiService);
//   private readonly route = inject(ActivatedRoute);
//   private readonly router = inject(Router);

//   readonly form: PositionFormGroup = this.formService.build();

//   readonly isSubmitting = signal(false);
//   readonly apiError = signal<string | null>(null);
//   readonly fieldErrors = signal<Record<string, string[]>>({});

//   readonly state = toSignal(
//   this.route.paramMap.pipe(
//     map((pm) => pm.get('id')),
//     map((idParam) => {
//       const id = Number(idParam);
//       return !idParam || Number.isNaN(id) ? null : id;
//     }),
//     switchMap((id) => {
//       if (!id) return of<PageState>({ status: 'error', message: 'Invalid position id.' });

//       return this.api.getById(id).pipe(
//         tap((dto) => this.formService.patchFromDto(this.form, dto)),
//         map((dto): PageState => ({ status: 'ready', positionId: id, dto })),
//         catchError(() => of<PageState>({ status: 'error', message: 'Unable to load this position.' }))
//       );
//     }),
//     startWith<PageState>({ status: 'loading' })
//   )
// );

//   submit(positionId: number): void {
//     this.apiError.set(null);
//     this.fieldErrors.set({});

//     if (this.form.invalid) {
//       this.form.markAllAsTouched();
//       return;
//     }

//     this.isSubmitting.set(true);
//     const payload: PositionCreatePayload = this.formService.toPayload(this.form);

//     this.api
//       .patch(positionId, payload)
//       .pipe(takeUntilDestroyed())
//       .subscribe({
//         next: () => {
//           this.isSubmitting.set(false);
//           void this.router.navigateByUrl('/positions');
//         },
//         error: (err: unknown) => {
//           this.isSubmitting.set(false);
//           this.handleApiError(err);
//         },
//       });
//   }

//   cancel(): void {
//     void this.router.navigateByUrl('/positions');
//   }

//   private handleApiError(err: unknown): void {
//     const httpLike = isRecord(err) ? err : null;
//     const body = httpLike && 'error' in httpLike ? httpLike['error'] : null;
//     const data: unknown = body;

//     if (isRecord(data)) {
//       const detail = data['detail'];
//       if (typeof detail === 'string') {
//         this.apiError.set(detail);
//         return;
//       }

//       const mapped: Record<string, string[]> = Object.fromEntries(
//         Object.entries(data as ApiErrorBody).map(([k, v]) => [
//           k,
//           Array.isArray(v) ? v.map(String) : [String(v)],
//         ])
//       );

//       this.fieldErrors.set(mapped);
//       return;
//     }

//     this.apiError.set('Unable to save changes.');
//   }
// }
