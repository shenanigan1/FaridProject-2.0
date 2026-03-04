// import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
// import { Router, RouterModule } from '@angular/router';

// import { PoolsStore } from '@features/pools/services/pools.store';

// import { UiAlertComponent } from '@shared/ui/alert/alert.component';
// import { UiButtonPrimaryComponent } from '@shared/ui/button-primary/button-primary.component';
// import { UiIconButtonComponent } from '@shared/ui/icon-button/icon-button.component';
// import { UiTextInputComponent } from '@shared/ui/text-input/text-input.component';
// import { UiTextareaComponent } from '@shared/ui/textarea/textarea.component';
// import { UiCardComponent } from '@shared/ui/card/card.component';

// const CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

// @Component({
//   selector: 'app-pool-create-page',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ReactiveFormsModule,

//     UiAlertComponent,
//     UiButtonPrimaryComponent,
//     UiIconButtonComponent,
//     UiTextInputComponent,
//     UiTextareaComponent,
//     UiCardComponent,
//   ],
//   templateUrl: './pool-create.page.html',
//   changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class PoolCreatePageComponent {
//   private readonly fb = inject(FormBuilder);
//   private readonly router = inject(Router);
//   private readonly store = inject(PoolsStore);

//   readonly isLoading = this.store.isLoading;
//   readonly error = this.store.error;

//   readonly form = this.fb.nonNullable.group({
//     name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2)]),
//     code: this.fb.nonNullable.control('', [
//       Validators.required,
//       Validators.pattern(CODE_PATTERN),
//       Validators.minLength(3),
//       Validators.maxLength(50),
//     ]),
//     description: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
//   });

//   back(): void {
//     this.router.navigateByUrl('/pools');
//   }

//   normalizeCode(): void {
//     const raw = this.form.controls.code.value ?? '';
//     const normalized = raw
//       .trim()
//       .toUpperCase()
//       .replace(/\s+/g, '_')
//       .replace(/[^A-Z0-9_]/g, '');
//     this.form.controls.code.setValue(normalized);
//   }

//   submit(): void {
//     if (this.form.invalid || this.isLoading()) {
//       this.form.markAllAsTouched();
//       return;
//     }

//     const dto = {
//       name: this.form.controls.name.value.trim(),
//       description: this.form.controls.description.value.trim(),
//       code: this.form.controls.code.value.trim(),
//     };

//     this.store.create(dto, () => this.back());
//   }
// }
