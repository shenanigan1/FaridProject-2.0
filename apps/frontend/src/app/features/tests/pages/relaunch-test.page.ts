import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AdminTemplateCard, TestsAdminBffService } from '../services/tests-admin-bff.service';

@Component({
  standalone: true,
  selector: 'app-relaunch-test-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './relaunch-test.page.html',
  styleUrl: './tests-workflow.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelaunchTestPage {
  private readonly bff = inject(TestsAdminBffService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly candidateId = Number(this.route.snapshot.paramMap.get('candidateId'));
  readonly applicationId = Number(this.route.snapshot.queryParamMap.get('applicationId'));
  readonly templates = signal<AdminTemplateCard[]>([]);
  readonly selectedTemplateId = signal<number | null>(null);
  readonly error = signal<string | null>(null);
  readonly query = signal('');
  readonly searchControl = new FormControl('', { nonNullable: true });

  readonly filteredTemplates = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.templates().filter((template) => {
      const blob = `${template.name} ${template.description} ${template.difficulty}`.toLowerCase();
      return !query || blob.includes(query);
    });
  });

  readonly selectedTemplate = computed(() =>
    this.templates().find((template) => template.id === this.selectedTemplateId()) ?? null,
  );

  constructor() {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.query.set(value));
    this.load();
  }

  selectTemplate(templateId: number): void {
    this.selectedTemplateId.set(templateId);
  }

  confirmSelection(): void {
    const selected = this.selectedTemplateId();
    if (!selected || !Number.isInteger(this.applicationId) || this.applicationId <= 0) {
      this.error.set('Application introuvable pour lancer le test.');
      return;
    }

    void this.router.navigate(['/tests/launch', this.applicationId, selected]);
  }

  private load(): void {
    this.bff
      .listTemplates()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (templates) => {
          this.templates.set(templates);
          this.selectedTemplateId.set(templates[0]?.id ?? null);
        },
        error: () => this.error.set('Impossible de charger les modules de test.'),
      });
  }
}
