import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthSessionService } from '@auth/services/auth-session.service';
import { MeResponse } from '@auth/models/auth.models';
import { ManagerTestItem, ManagerTestsService } from '../services/manager-tests.service';

@Component({
  standalone: true,
  selector: 'app-manager-home-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './manager-home.page.html',
  styleUrl: './manager-home.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagerHomePage {
  private readonly auth = inject(AuthSessionService);
  private readonly testsService = inject(ManagerTestsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly me = signal<MeResponse | null>(null);
  readonly tests = signal<ManagerTestItem[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly pendingTests = computed(() =>
    this.tests().filter((test) => test.status === 'in_progress'),
  );
  readonly completedTests = computed(() =>
    this.tests().filter((test) => test.status !== 'in_progress'),
  );
  readonly latestPendingTests = computed(() => this.pendingTests().slice(0, 4));
  readonly latestCompletedTests = computed(() => this.completedTests().slice(0, 3));

  constructor() {
    forkJoin({
      me: this.auth.loadMeOnce(),
      tests: this.testsService.listAssignedTests(),
    })
      .pipe(
        catchError(() => {
          this.error.set('Unable to load manager workspace.');
          return of({ me: null, tests: [] as ManagerTestItem[] });
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ me, tests }) => {
        this.me.set(me);
        this.tests.set(tests);
        this.isLoading.set(false);
      });
  }

  greetingName(): string {
    const user = this.me();
    return user?.first_name || user?.email || '';
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
}
