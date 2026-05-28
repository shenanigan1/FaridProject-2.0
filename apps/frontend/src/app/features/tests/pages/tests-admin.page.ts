import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import {
  AdminTestListItem,
  AdminTemplateCard,
  TestsAdminBffService,
} from '../services/tests-admin-bff.service';

type TestsAdminView = 'tests' | 'templates';

@Component({
  standalone: true,
  selector: 'app-tests-admin-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './tests-admin.page.html',
  styleUrl: './tests-workflow.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestsAdminPage {
  private readonly bff = inject(TestsAdminBffService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  readonly activeView = signal<TestsAdminView>('tests');
  readonly activeFilter = signal('Tous');
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly filters = [
    'Tous',
    'En cours',
    'Score sous revue',
    'Valide',
    'Conduite',
    'Securite',
    'Documentation',
  ];

  readonly activeTests = signal<AdminTestListItem[]>([]);
  readonly templates = signal<AdminTemplateCard[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly query = signal('');

  readonly filteredActiveTests = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.activeFilter().toLowerCase();
    return this.activeTests().filter((test) => {
      const blob =
        `${test.candidateName} ${test.candidateEmail} ${test.templateName} ${test.positionTitle} ${test.managerName} ${test.status} ${test.statusLabel}`.toLowerCase();
      const matchesQuery = !query || blob.includes(query);
      const matchesFilter = filter === 'tous' || blob.includes(filter);
      return matchesQuery && matchesFilter;
    });
  });

  readonly filteredTemplates = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.activeFilter().toLowerCase();
    return this.templates().filter((template) => {
      const blob = `${template.name} ${template.description} ${template.difficulty}`.toLowerCase();
      const matchesQuery = !query || blob.includes(query);
      const matchesFilter = filter === 'tous' || blob.includes(filter);
      return matchesQuery && matchesFilter;
    });
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.query.set(value));
    this.applyInitialQueryParams();
    this.load();
  }

  setView(view: TestsAdminView): void {
    this.activeView.set(view);
    this.activeFilter.set('Tous');
    this.searchControl.setValue('');
  }

  setFilter(filter: string): void {
    this.activeFilter.set(filter);
  }

  isTestsView(): boolean {
    return this.activeView() === 'tests';
  }

  difficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile',
    };
    return labels[difficulty] ?? difficulty;
  }

  private load(): void {
    forkJoin({
      activeTests: this.bff.listActiveTests(),
      templates: this.bff.listTemplates(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ activeTests, templates }) => {
          this.activeTests.set(activeTests);
          this.templates.set(templates);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les tests.');
          this.isLoading.set(false);
        },
      });
  }

  private applyInitialQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const query = params.get('q') ?? '';
    const status = params.get('status');

    if (query) {
      this.searchControl.setValue(query);
      this.query.set(query);
    }

    if (status && this.filters.includes(status)) {
      this.activeFilter.set(status);
    }
  }
}
