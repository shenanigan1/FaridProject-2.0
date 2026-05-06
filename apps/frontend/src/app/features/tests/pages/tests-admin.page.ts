import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import {
  AdminTestStatus,
  AdminTestListItem,
  AdminTemplateCard,
  TestsAdminBffService,
} from '../services/tests-admin-bff.service';

type TestsAdminView = 'tests' | 'templates';
type TestsStatusFilter = 'all' | 'done' | AdminTestStatus;
type TestsSortKey = 'date_desc' | 'date_asc' | 'progress_desc' | 'progress_asc' | 'candidate_asc' | 'status_asc';

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
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeView = signal<TestsAdminView>('tests');
  readonly activeFilter = signal('Tous');
  readonly statusFilter = signal<TestsStatusFilter>('all');
  readonly sortKey = signal<TestsSortKey>('date_desc');
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly filters = ['Tous', 'Conduite', 'Securite', 'Documentation'];
  readonly statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'done', label: 'Tests effectues' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Score sous revue' },
    { value: 'validated', label: 'Valide' },
  ] as const;
  readonly sortOptions = [
    { value: 'date_desc', label: 'Plus recent' },
    { value: 'date_asc', label: 'Plus ancien' },
    { value: 'progress_desc', label: 'Progression haute' },
    { value: 'progress_asc', label: 'Progression basse' },
    { value: 'candidate_asc', label: 'Candidat A-Z' },
    { value: 'status_asc', label: 'Statut' },
  ] as const;

  readonly activeTests = signal<AdminTestListItem[]>([]);
  readonly templates = signal<AdminTemplateCard[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly query = signal('');
  readonly applicationIdFilter = signal<number | null>(null);

  readonly filteredActiveTests = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.activeFilter().toLowerCase();
    const statusFilter = this.statusFilter();
    const filtered = this.activeTests().filter((test) => {
      const blob =
        `${test.candidateName} ${test.candidateEmail} ${test.templateName} ${test.positionTitle} ${test.status}`
          .toLowerCase();
      const matchesQuery = !query || blob.includes(query);
      const matchesFilter = filter === 'tous' || blob.includes(filter);
      const matchesStatus = this.matchesStatusFilter(test, statusFilter);
      const matchesApplication =
        this.applicationIdFilter() === null || test.applicationId === this.applicationIdFilter();
      return matchesQuery && matchesFilter && matchesStatus && matchesApplication;
    });
    return this.sortTests(filtered);
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
    this.applyQueryParams();
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.query.set(value));
    this.load();
  }

  setView(view: TestsAdminView): void {
    this.activeView.set(view);
    this.activeFilter.set('Tous');
    this.statusFilter.set('all');
    this.sortKey.set('date_desc');
    this.applicationIdFilter.set(null);
    this.searchControl.setValue('');
  }

  setFilter(filter: string): void {
    this.activeFilter.set(filter);
  }

  setStatusFilter(status: TestsStatusFilter): void {
    this.statusFilter.set(status);
  }

  setSort(sortKey: TestsSortKey): void {
    this.sortKey.set(sortKey);
  }

  onStatusFilterChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.setStatusFilter(target.value as TestsStatusFilter);
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.setSort(target.value as TestsSortKey);
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

  private sortTests(tests: AdminTestListItem[]): AdminTestListItem[] {
    return [...tests].sort((left, right) => {
      switch (this.sortKey()) {
        case 'date_asc':
          return left.receivedAt.localeCompare(right.receivedAt);
        case 'progress_desc':
          return right.progressPercent - left.progressPercent;
        case 'progress_asc':
          return left.progressPercent - right.progressPercent;
        case 'candidate_asc':
          return left.candidateName.localeCompare(right.candidateName);
        case 'status_asc':
          return left.statusLabel.localeCompare(right.statusLabel);
        case 'date_desc':
        default:
          return right.receivedAt.localeCompare(left.receivedAt);
      }
    });
  }

  private matchesStatusFilter(test: AdminTestListItem, statusFilter: TestsStatusFilter): boolean {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'done') return test.status === 'completed' || test.status === 'validated';
    return test.status === statusFilter;
  }

  private applyQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    const q = params.get('q') ?? '';
    const status = params.get('status');
    const sort = params.get('sort');
    const applicationId = Number(params.get('applicationId'));

    if (q) {
      this.searchControl.setValue(q, { emitEvent: false });
      this.query.set(q);
    }
    if (this.isStatusFilter(status)) {
      this.statusFilter.set(status);
    }
    if (this.isSortKey(sort)) {
      this.sortKey.set(sort);
    }
    if (Number.isInteger(applicationId) && applicationId > 0) {
      this.applicationIdFilter.set(applicationId);
    }
  }

  private isStatusFilter(value: string | null): value is TestsStatusFilter {
    return value === 'all' || value === 'done' || value === 'in_progress' || value === 'completed' || value === 'validated';
  }

  private isSortKey(value: string | null): value is TestsSortKey {
    return (
      value === 'date_desc' ||
      value === 'date_asc' ||
      value === 'progress_desc' ||
      value === 'progress_asc' ||
      value === 'candidate_asc' ||
      value === 'status_asc'
    );
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
}
