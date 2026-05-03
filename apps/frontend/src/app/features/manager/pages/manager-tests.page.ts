import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ManagerTestItem, ManagerTestsService } from '../services/manager-tests.service';

type ManagerTestsTab = 'todo' | 'history';

@Component({
  standalone: true,
  selector: 'app-manager-tests-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './manager-tests.page.html',
  styleUrl: './manager-tests.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerTestsPage {
  private readonly testsService = inject(ManagerTestsService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly query = new FormControl('', { nonNullable: true });
  readonly activeTab = signal<ManagerTestsTab>('todo');
  readonly tests = signal<ManagerTestItem[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly queryValue = signal('');

  readonly filteredTests = computed(() => {
    const normalized = this.queryValue().trim().toLowerCase();
    const todo = this.activeTab() === 'todo';
    return this.tests().filter((test) => {
      const isTodo = test.status === 'in_progress';
      if (todo !== isTodo) return false;
      if (!normalized) return true;

      return [
        test.candidateName,
        test.candidateEmail,
        test.positionTitle,
        test.templateName,
        test.status,
      ].join(' ').toLowerCase().includes(normalized);
    });
  });

  constructor() {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'history') {
      this.activeTab.set('history');
    }

    this.query.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.queryValue.set(value));

    this.load();
  }

  setTab(tab: ManagerTestsTab): void {
    this.activeTab.set(tab);
  }

  initials(test: ManagerTestItem): string {
    const source = test.candidateName || test.candidateEmail;
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  private load(): void {
    this.testsService
      .listAssignedTests()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tests) => {
          this.tests.set(tests);
          this.isLoading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger vos tests assignes.');
          this.isLoading.set(false);
        },
      });
  }
}
