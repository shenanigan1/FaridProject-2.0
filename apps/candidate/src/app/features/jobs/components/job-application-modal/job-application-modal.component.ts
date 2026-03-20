import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { CandidateUser } from '@auth/models/candidate-user.model';
import { JobApplicationPayload } from '@jobs/models/job-application.model';
import { ModalComponent } from '@shared/ui/modal/modal.component';

@Component({
  selector: 'app-job-application-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './job-application-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobApplicationModalComponent {
  private readonly fb = inject(FormBuilder);

  @Input({ required: true }) set user(value: CandidateUser) {
    this.form.patchValue(value);
  }

  @Output() close = new EventEmitter<void>();
  @Output() submitApplication = new EventEmitter<JobApplicationPayload>();

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    coverLetter: ['', [Validators.required, Validators.minLength(30)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitApplication.emit(this.form.getRawValue());
  }
}
