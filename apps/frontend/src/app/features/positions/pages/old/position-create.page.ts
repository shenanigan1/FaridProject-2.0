// import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router } from '@angular/router';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// import { PageShellComponent } from '@layout/page-shell/page-shell.component';
// import { PositionFormComponent } from '@features/positions/components/position-form/position-form.component';
// import { PositionFormService, PositionFormGroup } from '@features/positions/services/positions-form.service';
// import { PositionsApiService, PositionCreatePayload } from '@features/positions/services/positions-api.service';

// import { UiLinkButtonComponent } from '@lib-ui/link-button/ui-link-button.component';

// type ApiErrorBody = Record<string, unknown>;

// function isRecord(value: unknown): value is Record<string, unknown> {
//   return typeof value === 'object' && value !== null && !Array.isArray(value);
// }

// @Component({
//   standalone: true,
//   selector: 'app-position-create-page',
//   imports: [CommonModule, PageShellComponent, PositionFormComponent, UiLinkButtonComponent],
//   templateUrl: './position-create.page.html',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class PositionCreatePage {
//   private readonly formService = inject(PositionFormService);
//   private readonly api = inject(PositionsApiService);
//   private readonly router = inject(Router);

//   readonly form: PositionFormGroup = this.formService.build();

//   readonly isSubmitting = signal(false);
//   readonly apiError = signal<string | null>(null);
//   readonly fieldErrors = signal<Record<string, string[]>>({});

//   submit(): void {
//     this.apiError.set(null);
//     this.fieldErrors.set({});

//     if (this.form.invalid) {
//       this.form.markAllAsTouched();
//       return;
//     }

//     this.isSubmitting.set(true);
//     const payload: PositionCreatePayload = this.formService.toPayload(this.form);

//     this.api
//       .create(payload)
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

//     this.apiError.set('Unable to create position.');
//   }
// }
