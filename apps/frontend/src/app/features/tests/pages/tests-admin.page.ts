import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TemplatesListPage } from '@features/test-templates/pages/test-templates-list.page';
import { TestsInProgressPage } from './tests-in-progress.page';

type TestsAdminView = 'tests' | 'templates';

@Component({
  standalone: true,
  selector: 'app-tests-admin-page',
  imports: [CommonModule, TestsInProgressPage, TemplatesListPage],
  templateUrl: './tests-admin.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestsAdminPage {
  readonly activeView = signal<TestsAdminView>('tests');

  setView(view: TestsAdminView): void {
    this.activeView.set(view);
  }

  isTestsView(): boolean {
    return this.activeView() === 'tests';
  }
}
