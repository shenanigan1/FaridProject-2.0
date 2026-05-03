import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { LaunchContext, TestsAdminBffService } from '../services/tests-admin-bff.service';

@Component({
  standalone: true,
  selector: 'app-launch-evaluation-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './launch-evaluation.page.html',
  styleUrl: './tests-workflow.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LaunchEvaluationPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bff = inject(TestsAdminBffService);
  private readonly destroyRef = inject(DestroyRef);

  readonly applicationId = Number(this.route.snapshot.paramMap.get('applicationId'));
  readonly templateId = Number(this.route.snapshot.paramMap.get('templateId'));
  readonly context = signal<LaunchContext | null>(null);
  readonly managerBySection = signal<Record<number, string>>({});
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.load();
  }

  completedCount(): number {
    const assignments = this.managerBySection();
    return this.context()?.sections.filter((section) => Number(assignments[section.id]) > 0).length ?? 0;
  }

  completion(): number {
    const total = this.context()?.sections.length ?? 0;
    return total === 0 ? 0 : Math.round((this.completedCount() / total) * 100);
  }

  setManager(sectionId: number, managerId: string): void {
    this.managerBySection.update((current) => ({ ...current, [sectionId]: managerId }));
  }

  launch(): void {
    const context = this.context();
    if (!context) return;

    const assignments = context.sections.map((section) => {
      const managerId = Number(this.managerBySection()[section.id]);
      return {
        section_id: section.id,
        manager_id: Number.isInteger(managerId) && managerId > 0 ? managerId : 0,
      };
    });

    if (assignments.some((assignment) => assignment.manager_id <= 0)) {
      this.error.set('Assigne un manager a chaque module avant de lancer l evaluation.');
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);
    this.bff
      .launchEvaluation(context.applicationId, context.templateId, assignments)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          void this.router.navigate(['/tests']);
        },
        error: () => {
          this.isSubmitting.set(false);
          this.error.set('Impossible de lancer cette evaluation.');
        },
      });
  }

  private load(): void {
    if (
      !Number.isInteger(this.applicationId) ||
      this.applicationId <= 0 ||
      !Number.isInteger(this.templateId) ||
      this.templateId <= 0
    ) {
      this.error.set('Configuration de lancement invalide.');
      this.isLoading.set(false);
      return;
    }

    this.bff
      .getLaunchContext(this.applicationId, this.templateId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (context) => {
          this.context.set(context);
          this.managerBySection.set(Object.fromEntries(context.sections.map((section) => [section.id, ''])));
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger la configuration du test.');
          this.isLoading.set(false);
        },
      });
  }
}
